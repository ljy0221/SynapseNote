import * as Y from 'yjs';
import { Block, BlockHistory, BlockProperties } from '../models/Block';
import { loadEnv } from '../config/env';
import _ from 'lodash';

// Yjs에서 넘어오는 블록 데이터 구조 인터페이스
interface YjsBlockData {
  id: string;
  type: string;
  properties: BlockProperties;
  // CodeBlock specific (Root Level in YJS -> Root Level in MongoDB)
  outputHistory?: Array<any>;
  lastOutput?: string;
  lastExecutedAt?: string; // YJS sends as string/ISO8601
}

class BridgeService {
  private debounceTimers: Map<string, NodeJS.Timeout>;
  private readonly DEBOUNCE_TIME: number;

  constructor() {
    this.debounceTimers = new Map();
    const env = loadEnv();
    this.DEBOUNCE_TIME = env.MONGO_SYNC_DEBOUNCE_MS;
  }

  public handleUpdate(noteId: string, yDoc: Y.Doc): void {
    if (this.debounceTimers.has(noteId)) {
      clearTimeout(this.debounceTimers.get(noteId)!);
    }

    const timer = setTimeout(() => {
      this.syncToDB(noteId, yDoc);
      this.debounceTimers.delete(noteId);
    }, this.DEBOUNCE_TIME);

    this.debounceTimers.set(noteId, timer);
  }


  private async syncToDB(noteId: string, yDoc: Y.Doc): Promise<void> {
    try {
      // 1. Yjs 데이터 추출
      const yArray = yDoc.getArray<YjsBlockData>('blocks'); // 프론트와 합의된 이름
      const currentBlocks: YjsBlockData[] = yArray.toJSON();

      if (!currentBlocks || currentBlocks.length === 0) return;

      console.log(`[Bridge] Syncing Doc ${noteId}, Count: ${currentBlocks.length}`);

      // 2. DB 데이터 조회 (성능 최적화를 위해 map핑)
      const dbBlocks = await Block.find({ noteId }).lean();
      const dbBlocksMap = new Map(dbBlocks.map(b => [b.blockId, b]));

      const bulkOps: any[] = [];
      const historyOps: any[] = []; // History 벌크 저장을 위한 배열
      const currentBlockIds = new Set<string>();

      // 3. 루프 돌며 비교 (Diff Logic)
      for (let i = 0; i < currentBlocks.length; i++) {
        const yBlock = currentBlocks[i];

        // ID 없으면 스킵
        if (!yBlock.id) continue;
        currentBlockIds.add(yBlock.id);

        let cleanProps = { ...yBlock.properties };

        // [최적화] JsonMarkdownConverter 제거 - YJS가 주는 string 그대로 저장.

        // Spring용 _class 결정
        const springClass = yBlock.type;

        const existingBlock = dbBlocksMap.get(yBlock.id);

        // CodeBlock용 Root Field 추출
        const rootFields: any = {};
        if (springClass === 'code') {
          if (yBlock.outputHistory) rootFields.outputHistory = yBlock.outputHistory;
          if (yBlock.lastOutput) rootFields.lastOutput = yBlock.lastOutput;
          if (yBlock.lastExecutedAt) rootFields.lastExecutedAt = new Date(yBlock.lastExecutedAt);
        }

        if (existingBlock) {

          // 1. Properties 비교
          const isPropsChanged = !_.isEqual(existingBlock.properties, cleanProps);

          // 2. Type 비교
          const isTypeChanged = existingBlock.type !== yBlock.type;

          // 3. Class 비교
          const isClassChanged = existingBlock._class !== springClass;

          // 4. Root Field 비교 (CodeBlock의 경우)
          let isRootChanged = false;
          if (springClass === 'code') {
            const dbHistory = existingBlock.toObject ? existingBlock.toObject().outputHistory || [] : (existingBlock as any).outputHistory || [];
            const yHistory = rootFields.outputHistory || [];
            if (!_.isEqual(dbHistory, yHistory)) isRootChanged = true;
            if ((existingBlock as any).lastOutput !== rootFields.lastOutput) isRootChanged = true;
          }

          if (isPropsChanged || isTypeChanged || isRootChanged || isClassChanged) {
            // A. 히스토리 저장 (벌크용 배열에 추가)
            historyOps.push({
              blockId: yBlock.id,
              noteId: noteId,
              previousProperties: existingBlock.properties,
              previousType: existingBlock.type,
              changedAt: new Date()
            });

            // B. 블록 업데이트
            bulkOps.push({
              updateOne: {
                filter: { blockId: yBlock.id },
                update: {
                  $set: {
                    _class: springClass,
                    type: yBlock.type,
                    properties: cleanProps,
                    order: i,
                    ...rootFields
                  }
                }
              }
            });
          } else if (existingBlock.order !== i) {
            // 순서만 변경
            bulkOps.push({
              updateOne: {
                filter: { blockId: yBlock.id },
                update: { $set: { order: i } }
              }
            });
          }

        } else {
          // --- 생성 (Create) ---
          bulkOps.push({
            insertOne: {
              document: {
                _class: springClass,
                noteId: noteId,
                blockId: yBlock.id,
                type: yBlock.type,
                properties: cleanProps,
                order: i,
                ...rootFields
              }
            }
          });
        }
      }

      // 4. 삭제 (Delete)
      const toDeleteIds = dbBlocks
        .filter(b => !currentBlockIds.has(b.blockId))
        .map(b => b.blockId);

      if (toDeleteIds.length > 0) {
        bulkOps.push({
          deleteMany: {
            filter: { blockId: { $in: toDeleteIds } }
          }
        });
      }

      // 5. 실행
      const promises = [];

      if (bulkOps.length > 0) {
        promises.push(Block.bulkWrite(bulkOps));
      }

      // [최적화] History 벌크 저장
      if (historyOps.length > 0) {
        promises.push(BlockHistory.insertMany(historyOps));
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        console.log(`[Bridge] Sync Success. Updates: ${bulkOps.length}, History: ${historyOps.length}`);
      }

    } catch (error) {
      console.error(`[Bridge Error] Failed to sync ${noteId}:`, error);
    }
  }
}

export default new BridgeService();