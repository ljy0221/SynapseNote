import * as Y from 'yjs';
import { Block, BlockHistory, BlockProperties } from '../models/Block';
import { Note } from '../models/Note';
import { Binary } from 'mongodb';
import { v7 as uuidv7 } from 'uuid';
import * as _ from 'lodash';

// UUID 유틸리티
function uuidToBuffer(uuid: string): Binary | string {
  if (!uuid) return uuid;
  // 이미 Binary이면 그대로 반환
  if (typeof uuid === 'object' && (uuid as any)._bsontype === 'Binary') return uuid;
  // 36자 문자열이면 변환
  if (typeof uuid === 'string' && uuid.length === 36) {
    return new Binary(Buffer.from(uuid.replace(/-/g, ''), 'hex'), 4);
  }
  return uuid;
}

function toUuidString(bufferOrString: any): string {
  if (!bufferOrString) return '';
  if (typeof bufferOrString === 'string') return bufferOrString;
  if (bufferOrString._bsontype === 'Binary') {
    const hex = bufferOrString.toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return '';
}

function normalizeToHex(id: any): string {
  if (!id) return '';
  if (typeof id === 'string') return id.replace(/-/g, '').toLowerCase();
  if (id._bsontype === 'Binary') return id.toString('hex').toLowerCase();
  return '';
}

function generateUuidV7(): string {
  return uuidv7();
}

interface UserContext {
  userId: string;
  name: string;
}

class BridgeService {
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_TIME = 2000;

  constructor() {
    this.handleUpdate = this.handleUpdate.bind(this);
  }

  public handleUpdate(docName: string, yDoc: Y.Doc, origin: any) {
    if (origin === 'from-db') return;
    if (!docName.startsWith('note:')) return;

    const noteId = docName.split(':')[1];

    // User Context extraction (if available in origin)
    // const userContext = ...

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

      const queryNoteId = uuidToBuffer(noteId);
      const dbBlocks = await Block.find({ noteId: queryNoteId }).lean();

      // [Fix] Explicit map creation to avoid syntax errors
      const safeDbBlocks = Array.isArray(dbBlocks) ? dbBlocks : [];
      const dbBlocksMap = new Map();
      safeDbBlocks.forEach((b: any) => {
        dbBlocksMap.set(normalizeToHex(b.blockId), b);
      });

      const bulkOps: any[] = [];
      const currentBlockIds = new Set<string>();
      const processedBlockIds = new Set<string>();

      for (let i = 0; i < currentBlocks.length; i++) {
        const yBlock = currentBlocks[i];

        if (!yBlock.blockId) {
          const newId = generateUuidV7();
          const yBlockMap = yArray.get(i);
          if (yBlockMap instanceof Y.Map) {
            yBlockMap.set('blockId', newId);
            yBlock.blockId = newId;
          } else {
            continue;
          }
        }

        const validBlockId = toUuidString(yBlock.blockId);
        const blockIdHex = normalizeToHex(validBlockId);
        currentBlockIds.add(blockIdHex);

        if (processedBlockIds.has(blockIdHex)) {
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
                    blockId: uuidToBuffer(validBlockId),
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
                noteId: queryNoteId,
                blockId: uuidToBuffer(validBlockId),
                properties: cleanProps,
                bookmark: yBlock.bookmark ?? false,
                order: i,
                ...rootFields
              }
            }
          });
        }
      }

      // Delete blocks not in Yjs
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

        // [New] Note updatedAt update logic
        await Note.updateOne(
          { _id: queryNoteId },
          { $set: { updatedAt: new Date() } }
        );
        console.log(`[Bridge] Note ${noteId} updatedAt bumped.`);
      }
    } catch (error) {
      console.error(`[Bridge Error] syncToDB failed for ${noteId}:`, error);
    }
  }
}

export default new BridgeService();