import * as Y from 'yjs';
import { Block, BlockHistory, BlockProperties } from '../models/Block';
import { loadEnv } from '../config/env';
import _ from 'lodash';
import connectionManager, { UserContext } from '../ws/connectionManager';
import { generateUuidV7 } from '../utils/uuid';
import { Binary } from 'mongodb';

/**
 * ID(Buffer 혹은 String)를 일관된 소문자 Hex 문자열로 변환
 */
function normalizeToHex(id: any): string {
  if (!id) return '';
  if (Buffer.isBuffer(id)) return id.toString('hex').toLowerCase();

  // mongodb Binary 객체 대응
  if (id._bsontype === 'Binary') {
    return id.value(true).toString('hex').toLowerCase();
  }

  if (typeof id === 'string') return id.replace(/-/g, '').toLowerCase();

  // 기타 객체 (Mongoose 가공 객체 등) 대응
  if (id.buffer && Buffer.isBuffer(id.buffer)) return id.buffer.toString('hex').toLowerCase();

  return id.toString().replace(/-/g, '').toLowerCase();
}

/**
 * UUID 문자열을 MongoDB Binary(subtype 04 - Standard UUID) 호환 객체로 변환
 * - Java(Spring Boot)의 "standard" UUID representation과 호환
 */
function uuidToBuffer(uuid: string): Binary | string {
  if (!uuid || typeof uuid !== 'string') return uuid;
  const hex = uuid.replace(/-/g, '');
  if (hex.length !== 32) return uuid;
  try {
    const buffer = Buffer.from(hex, 'hex');
    return new Binary(buffer, 4); // Subtype 4 (Standard UUID) 강제
  } catch (e) {
    return uuid;
  }
}

/**
 * ID(Buffer 혹은 String)를 하이픈이 포함된 UUID 형식문자열로 변환
 */
function toUuidString(val: any): string {
  if (!val) return '';
  const hex = normalizeToHex(val);

  // 손상된 데이터(32자 미만 혹은 깨진 데이터) 발견 시 UUID v7으로 "치유(Heal)"
  if (hex.length !== 32 || hex.includes('efbfbd')) {
    const healedId = generateUuidV7();
    console.warn(`[Bridge] Invalid/Corrupted ID detected (${hex}). Healed to: ${healedId}`);
    return healedId;
  }

  return hex.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

// Yjs에서 넘어오는 블록 데이터 구조 인터페이스
interface YjsBlockData {
  blockId: string;
  _class: string;
  properties: BlockProperties;
  bookmark?: boolean;
  outputHistory?: Array<any>;
  lastOutput?: string;
  lastExecutedAt?: string;
}

class BridgeService {
  private debounceTimers: Map<string, NodeJS.Timeout>;
  private readonly DEBOUNCE_TIME: number;

  constructor() {
    this.debounceTimers = new Map();
    const env = loadEnv();
    this.DEBOUNCE_TIME = env.MONGO_SYNC_DEBOUNCE_MS;
  }

  /**
   * DB에서 데이터를 불러와 Yjs 문서를 초기화 (서버 시작 시 1회)
   */
  public async initDocFromDB(noteId: string, yDoc: Y.Doc): Promise<void> {
    try {
      console.log(`[Bridge] initDocFromDB started for ${noteId}`);

      const queryId = uuidToBuffer(noteId); // Standard UUID (Subtype 04)로 조회
      const blocks = await Block.find({ noteId: queryId }).sort({ order: 1 }).lean();

      if (!blocks || blocks.length === 0) {
        console.log(`[Bridge] No existing blocks found for ${noteId}. Starting fresh.`);
        return;
      }

      const yblocks = yDoc.getArray<Y.Map<any>>('blocks');

      // 이미 데이터가 있다면 (다른 유저에 의해 이미 생성되었거나, 동기화가 진행된 경우)
      // DB 로딩을 생략하여 실시간 편집 중인 데이터를 보호함
      if (yblocks.length > 0) {
        console.log(`[Bridge] Doc ${noteId} already has ${yblocks.length} blocks. Skipping DB population.`);
        return;
      }

      yDoc.transact(() => {
        blocks.forEach((dbBlock: any) => {
          const blockMap = new Y.Map();

          // ID 정규화 (UUID String으로 변환)
          const bIdStr = toUuidString(dbBlock.blockId);
          const nIdStr = toUuidString(dbBlock.noteId);

          blockMap.set("blockId", bIdStr);
          blockMap.set("noteId", nIdStr);
          blockMap.set("_class", dbBlock._class);
          blockMap.set("bookmark", dbBlock.bookmark ?? false);
          blockMap.set("outputHistory", dbBlock.outputHistory || []);
          blockMap.set("order", dbBlock.order ?? 0);

          const propertiesMap = new Y.Map();
          if (dbBlock.properties) {
            Object.entries(dbBlock.properties).forEach(([key, value]) => {
              if (key === 'content' || key === 'code') {
                const yText = new Y.Text();
                yText.insert(0, value as string);
                propertiesMap.set(key, yText);
              } else {
                propertiesMap.set(key, value);
              }
            });
          }
          blockMap.set("properties", propertiesMap);

          yblocks.push([blockMap]);
        });
      });

      console.log(`[Bridge] initDocFromDB success. Blocks loaded: ${blocks.length}`);
    } catch (error) {
      console.error(`[Bridge Error] initDocFromDB failed for ${noteId}:`, error);
    }
  }

  public handleUpdate(noteId: string, yDoc: Y.Doc): void {
    console.log(`[Bridge] handleUpdate called for ${noteId}`);
    if (this.debounceTimers.has(noteId)) {
      clearTimeout(this.debounceTimers.get(noteId)!);
    }

    const timer = setTimeout(() => {
      this.syncToDB(noteId, yDoc);
      this.debounceTimers.delete(noteId);
    }, this.DEBOUNCE_TIME);

    this.debounceTimers.set(noteId, timer);
  }

  private async syncToDB(noteId: string, yDoc: Y.Doc, userContext?: UserContext): Promise<void> {
    try {
      const yArray = yDoc.getArray<any>('blocks');
      const currentBlocks = yArray.toJSON();

      if (!currentBlocks || currentBlocks.length === 0) {
        console.log(`[Bridge] No blocks to sync for ${noteId}.`);
        return;
      }

      const queryNoteId = uuidToBuffer(noteId); // Standard UUID (Subtype 04) 사용
      const dbBlocks = await Block.find({ noteId: queryNoteId }).lean();

      // DB 데이터 맵 생성 시 blockId를 Hex로 정규화하여 매칭률 향상
      const dbBlocksMap = new Map(dbBlocks.map((b: any) => [normalizeToHex(b.blockId), b]));
      const bulkOps: any[] = [];
      const currentBlockIds = new Set<string>();
      const processedBlockIds = new Set<string>(); // 배치 내 중복 처리 방지

      for (let i = 0; i < currentBlocks.length; i++) {
        const yBlock = currentBlocks[i];

        // blockId가 없으면 UUID v7 생성 (방어 코드)
        if (!yBlock.blockId) {
          const newId = generateUuidV7();
          console.log(`[Bridge] Assigning new UUID v7 to block at index ${i}: ${newId}`);

          // Yjs Map에 직접 주입 (이후 재귀적으로 syncToDB가 다시 호출됨)
          const yBlockMap = yArray.get(i);
          if (yBlockMap instanceof Y.Map) {
            yBlockMap.set('blockId', newId);
            yBlock.blockId = newId; // 현재 loop 처리를 위해 할당
          } else {
            console.warn(`[Bridge] Failed to set blockId on non-Map block at index ${i}`);
            continue;
          }
        }

        const validBlockId = toUuidString(yBlock.blockId);
        const blockIdHex = normalizeToHex(validBlockId);
        currentBlockIds.add(blockIdHex);

        // 이미 이번 배치에서 처리한 ID면 스킵 (Yjs 문서 내 중복 방어)
        if (processedBlockIds.has(blockIdHex)) {
          console.warn(`[Bridge] Duplicate blockId detected in sync batch: ${validBlockId}`);
          continue;
        }
        processedBlockIds.add(blockIdHex);

        const springClass = yBlock._class;
        const existingBlock = dbBlocksMap.get(blockIdHex);

        const cleanProps: any = {};
        if (yBlock.properties) {
          Object.entries(yBlock.properties).forEach(([key, val]) => {
            cleanProps[key] = val;
          });
        }

        const rootFields: any = {
          outputHistory: yBlock.outputHistory || (springClass === 'code' ? [] : undefined)
        };

        if (springClass === 'code') {
          if (yBlock.lastOutput) rootFields.lastOutput = yBlock.lastOutput;
          if (yBlock.lastExecutedAt) rootFields.lastExecutedAt = yBlock.lastExecutedAt;
        }

        if (existingBlock) {
          const isPropsChanged = !_.isEqual(existingBlock.properties, cleanProps);
          const isMetadataChanged = existingBlock._class !== springClass ||
            (existingBlock as any).bookmark !== (yBlock.bookmark ?? false);

          if (isPropsChanged || isMetadataChanged || existingBlock.order !== i) {
            bulkOps.push({
              updateOne: {
                filter: { _id: existingBlock._id },
                update: {
                  $set: {
                    blockId: uuidToBuffer(validBlockId), // Subtype 04 저장
                    _class: springClass,
                    properties: cleanProps,
                    bookmark: yBlock.bookmark ?? false,
                    order: i,
                    ...rootFields
                  }
                }
              }
            });
          }
        } else {
          bulkOps.push({
            insertOne: {
              document: {
                _class: springClass,
                noteId: queryNoteId, // Subtype 04 저장
                blockId: uuidToBuffer(validBlockId), // Subtype 04 저장
                properties: cleanProps,
                bookmark: yBlock.bookmark ?? false,
                order: i,
                ...rootFields
              }
            }
          });
        }
      }

      // 4. 삭제 (Delete)
      const toDeleteOps = dbBlocks
        .filter((b: any) => !currentBlockIds.has(normalizeToHex(b.blockId)))
        .map((b: any) => ({
          deleteOne: {
            filter: { _id: b._id }
          }
        }));

      if (toDeleteOps.length > 0) {
        bulkOps.push(...toDeleteOps);
      }

      if (bulkOps.length > 0) {
        await Block.bulkWrite(bulkOps);
        console.log(`[Bridge] Sync Success for ${noteId}. Updates: ${bulkOps.length}`);
      }
    } catch (error) {
      console.error(`[Bridge Error] syncToDB failed for ${noteId}:`, error);
    }
  }

}

export default new BridgeService();