import * as Y from 'yjs';
import { Block, BlockHistory, BlockProperties } from '../models/Block';
import { convertToMarkdown } from '../utils/JsonMarkdownConverter';
import { loadEnv } from '../config/env';

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
      const currentBlockIds = new Set<string>();

      // 3. 루프 돌며 비교 (Diff Logic)
      for (let i = 0; i < currentBlocks.length; i++) {
        const yBlock = currentBlocks[i];

        // ID 없으면 스킵
        if (!yBlock.id) continue;
        currentBlockIds.add(yBlock.id);

        // 데이터 정제
        let cleanProps = { ...yBlock.properties };

        // 텍스트 계열의 attributes 등 세부 필드 처리
        // 'text' 타입이 메인이지만, 혹시 모를 호환성을 위해 유지하거나 'text'만 남김
        // 사용자가 매핑 필요없다고 했으므로 'text'로 통일된 것으로 가정
        if (yBlock.type === 'text') {
          // content 처리 (Markdown 변환 등)
          if (cleanProps.content) {
            cleanProps.content = convertToMarkdown(yBlock.type, cleanProps.content);
          }
          // attributes는 그대로 cleanProps에 포함됨
        }

        // Spring용 _class 결정 (매핑 없이 그대로 사용)
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
          // --- 수정 (Update) ---
          // 비교 로직 보강: Properties + Root Fields 변화 감지
          const isPropsChanged = JSON.stringify(existingBlock.properties) !== JSON.stringify(cleanProps);
          const isTypeChanged = existingBlock.type !== yBlock.type;
          const isClassChanged = existingBlock._class !== springClass; // _class 변경 확인 (비록 type과 같아도 명시적 확인)

          // Root Field 변경 감지 (CodeBlock의 경우)
          let isRootChanged = false;
          if (springClass === 'code') {
            const dbHistoryStr = JSON.stringify(existingBlock.toObject().outputHistory || []);
            const yHistoryStr = JSON.stringify(rootFields.outputHistory || []);
            if (dbHistoryStr !== yHistoryStr) isRootChanged = true;
            if (existingBlock.toObject().lastOutput !== rootFields.lastOutput) isRootChanged = true;
          }

          if (isPropsChanged || isTypeChanged || isRootChanged || isClassChanged) {
            // A. 히스토리 저장
            await BlockHistory.create({
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
                    ...rootFields // CodeBlock Root Fields 업데이트
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
                ...rootFields // CodeBlock Root Fields 저장
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
      if (bulkOps.length > 0) {
        await Block.bulkWrite(bulkOps);
        console.log(`[Bridge] Sync Success: ${bulkOps.length} ops`);
      }

    } catch (error) {
      console.error(`[Bridge Error] Failed to sync ${noteId}:`, error);
    }
  }
}

export default new BridgeService();