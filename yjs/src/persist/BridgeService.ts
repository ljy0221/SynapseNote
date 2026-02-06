import * as Y from 'yjs';
import { Block } from '../models/Block';
import { Note } from '../models/Note';
import { Binary } from 'mongodb';
import * as _ from 'lodash';
import * as crypto from 'crypto';

// UUID 유틸리티
function uuidToBuffer(uuid: string): Binary | string {
  if (!uuid) return uuid;
  if (typeof uuid === 'object' && (uuid as any)._bsontype === 'Binary') return uuid;
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
  return crypto.randomUUID(); // Fallback to v4 if v7 not explicitly needed, or use proper v7 impl if strict
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

  // [Fix] Match docManager usage: handleUpdate(noteId, yDoc, origin?)
  public handleUpdate(docName: string, yDoc: Y.Doc, origin?: any) {
    // If docName comes as "note:xyz" from y-websocket, we split.
    // If docManager sends pure UUID, we handle it.
    const noteId = docName.startsWith('note:') ? docName.split(':')[1] : docName;

    if (origin === 'from-db') return;

    if (this.debounceTimers.has(noteId)) {
      clearTimeout(this.debounceTimers.get(noteId)!);
    }

    const timer = setTimeout(() => {
      this.syncToDB(noteId, yDoc);
      this.debounceTimers.delete(noteId);
    }, this.DEBOUNCE_TIME);

    this.debounceTimers.set(noteId, timer);
  }

  // [Fix] Restore initDocFromDB logic
  public async initDocFromDB(noteId: string, yDoc: Y.Doc): Promise<void> {
    try {
      const queryNoteId = uuidToBuffer(noteId);
      const dbBlocks = await Block.find({ noteId: queryNoteId }).lean().sort({ order: 1 }) as any[];

      if (!dbBlocks || dbBlocks.length === 0) {
        console.log(`[Bridge] No blocks found in DB for ${noteId}`);
        return;
      }

      const yArray = yDoc.getArray('blocks');

      // Initialize YArray with DB content
      yDoc.transact(() => {
        if (yArray.length > 0) {
          yArray.delete(0, yArray.length); // Clear existing if any (unlikely on init)
        }

        const formattedBlocks = dbBlocks.map(block => {
          const blockMap = new Y.Map();
          // Core fields
          blockMap.set('blockId', toUuidString(block.blockId));
          blockMap.set('_class', block._class);

          // Nested properties
          if (block.properties) {
            const props = new Y.Map();
            Object.entries(block.properties).forEach(([k, v]) => {
              props.set(k, v);
            });
            blockMap.set('properties', props); // Note: Yjs expects properties to be a Map if you want to sync deeply? 
            // Actually typically Yjs stores properties as a JS object inside the Map if they are not collaborative themselves. 
            // But looking at syncToDB, it reads yBlock.properties.
            // Let's assume blockMap structure matches what syncToDB expects.
            // syncToDB: const cleanProps = ... Object.entries(yBlock.properties)
          }

          // Other fields
          if (block.bookmark !== undefined) blockMap.set('bookmark', block.bookmark);
          if (block.lastOutput) blockMap.set('lastOutput', block.lastOutput);
          if (block.lastExecutedAt) blockMap.set('lastExecutedAt', block.lastExecutedAt);
          if (block.outputHistory) blockMap.set('outputHistory', block.outputHistory);

          return blockMap;
        });

        // Insert as JSON/Map? 
        // yArray.insert(0, formattedBlocks); 
        // Wait, yArray.toJSON() returns simple objects in syncToDB. 
        // If we insert Y.Map instances, that makes it a shared type.
        // Yes, syncToDB checks `if (yBlockMap instanceof Y.Map)` in one place (line 120 approx).

        yArray.insert(0, formattedBlocks);
      }, 'from-db'); // Origin 'from-db' to prevent echo

      console.log(`[Bridge] Initialized ${dbBlocks.length} blocks from DB for ${noteId}`);

    } catch (error) {
      console.error(`[Bridge Error] initDocFromDB failed for ${noteId}:`, error);
      throw error;
    }
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

        // Ensure blockId exists
        if (!yBlock.blockId) {
          const newId = generateUuidV7();
          // We can't modify yArray here easily without transaction or knowing index reliably if changed.
          // ideally frontend should have generated it.
          // But here, we just assign to the object to proceed with DB save.
          yBlock.blockId = newId;
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

        // Use noteId string directly (not Binary) since Note schema uses String _id
        await Note.updateOne(
          { _id: noteId },
          { $set: { updatedAt: new Date() } }
        );
      }
    } catch (error) {
      console.error(`[Bridge Error] syncToDB failed for ${noteId}:`, error);
    }
  }
}

export default new BridgeService();