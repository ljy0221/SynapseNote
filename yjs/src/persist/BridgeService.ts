import * as Y from 'yjs';
import { Block, BlockHistory, BlockProperties } from '../models/Block';
import { loadEnv } from '../config/env';
import _ from 'lodash';
import connectionManager, { UserContext } from '../ws/connectionManager';

// Yjs에서 넘어오는 블록 데이터 구조 인터페이스
interface YjsBlockData {
  id: string;
  type: string;
  properties: BlockProperties;
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
      console.log(`[Bridge] syncToDB started for ${noteId}`);
      // 1. Yjs 데이터 추출
      const yArray = yDoc.getArray<YjsBlockData>('blocks');
      const currentBlocks: YjsBlockData[] = yArray.toJSON();

      if (!currentBlocks || currentBlocks.length === 0) {
        console.log(`[Bridge] No blocks found for ${noteId}, skipping sync`);
        return;
      }

      console.log(`[Bridge] Syncing Doc ${noteId}, Count: ${currentBlocks.length}`);

      // 2. DB 데이터 조회 (성능 최적화를 위해 매핑)
      const dbBlocks = await Block.find({ noteId }).lean();
      const dbBlocksMap = new Map(dbBlocks.map(b => [b.blockId, b]));

      const bulkOps: any[] = [];
      const currentBlockIds = new Set<string>();

      // 3. 루프 돌며 비교 (Diff Logic)
      for (let i = 0; i < currentBlocks.length; i++) {
        const yBlock = currentBlocks[i];

        // ID 없으면 스킵
        if (!yBlock.id) continue;
        currentBlockIds.add(yBlock.id);

        let cleanProps = { ...yBlock.properties };

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
            // 블록 업데이트
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

      // 5. 블록 업데이트 실행
      if (bulkOps.length > 0) {
        await Block.bulkWrite(bulkOps);
        console.log(`[Bridge] Sync Success for ${noteId}. Updates: ${bulkOps.length}`);
        console.log(`[Bridge] Sample of synced block IDs: ${currentBlocks.slice(0, 3).map(b => b.id).join(", ")}`);
      }

    } catch (error) {
      console.error(`[Bridge Error] Failed to sync ${noteId}:`, error);
    }
  }

}

export default new BridgeService();