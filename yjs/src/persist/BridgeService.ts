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
              // [Fix] Initialize as plain string/value from DB.
              // Clients will handle migration to specific Yjs types (e.g. Text -> XmlFragment).
              // This avoids server-side type mismatches and complex XML parsing.
              props.set(k, v);
            });
            blockMap.set('properties', props);
          }

          // Root-level fields
          if (block.bookmark !== undefined) blockMap.set('bookmark', block.bookmark);
          if (block.outputHistory) blockMap.set('outputHistory', block.outputHistory);
          if (block.lastOutput) blockMap.set('lastOutput', block.lastOutput);
          if (block.lastExecutedAt) blockMap.set('lastExecutedAt', block.lastExecutedAt);

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
      console.error(`[Bridge Error] initDocFromDB failed for ${noteId}: `, error);
      throw error;
    }
  }

  private async syncToDB(noteId: string, yDoc: Y.Doc, userContext?: UserContext): Promise<void> {
    try {
      const yArray = yDoc.getArray<Y.Map<any>>('blocks');
      // [Fix] Do NOT use toJSON() here as it strips XML tags from XmlFragment
      const currentBlocks = yArray.toArray();

      console.log(`[Bridge] syncToDB called for ${noteId}`);
      console.log(`[Bridge] Current blocks count: ${currentBlocks?.length || 0} `);

      if (currentBlocks && currentBlocks.length > 0) {
        console.log(`[Bridge] First block sample: `, JSON.stringify(currentBlocks[0], null, 2));
      }

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
        const blockId = yBlock.get('blockId');
        const springClass = yBlock.get('_class');

        // Ensure blockId exists
        let validBlockId = blockId;
        if (!validBlockId) {
          validBlockId = generateUuidV7();
          yDoc.transact(() => {
            yBlock.set('blockId', validBlockId);
          });
        }

        const blockIdStr = toUuidString(validBlockId);
        const blockIdHex = normalizeToHex(blockIdStr);
        currentBlockIds.add(blockIdHex);

        if (processedBlockIds.has(blockIdHex)) {
          continue;
        }
        processedBlockIds.add(blockIdHex);

        const existingBlock = dbBlocksMap.get(blockIdHex);

        const cleanProps: any = {};
        const yProperties = yBlock.get('properties');

        if (yProperties instanceof Y.Map) {
          yProperties.forEach((val, key) => {
            if (val instanceof Y.XmlFragment) {
              // [Fix] Extract plain text from XmlFragment for clean DB storage
              // Convert <paragraph>text</paragraph> structure to plain text with newlines
              const paragraphs: string[] = [];
              val.forEach((item: any) => {
                if (item instanceof Y.XmlElement && item.nodeName === 'paragraph') {
                  // Extract text from paragraph
                  let text = '';
                  item.forEach((child: any) => {
                    if (child instanceof Y.XmlText) {
                      text += child.toString();
                    }
                  });
                  paragraphs.push(text);
                }
              });
              cleanProps[key] = paragraphs.join('\n');
            } else if (val instanceof Y.Text || val instanceof Y.XmlElement) {
              // For other Yjs types, use toString
              cleanProps[key] = val.toString();
            } else if (val && typeof val.toJSON === 'function') {
              cleanProps[key] = val.toJSON();
            } else {
              cleanProps[key] = val;
            }
          });
        }

        const rootFields: any = {
          outputHistory: yBlock.get('outputHistory') || (springClass === 'code' ? [] : undefined)
        };

        if (springClass === 'code') {
          const lastOutput = yBlock.get('lastOutput');
          const lastExecutedAt = yBlock.get('lastExecutedAt');
          if (lastOutput) rootFields.lastOutput = lastOutput;
          if (lastExecutedAt) rootFields.lastExecutedAt = lastExecutedAt;
        }

        if (existingBlock) {
          const isPropsChanged = !_.isEqual(existingBlock.properties, cleanProps);
          const isMetadataChanged = existingBlock._class !== springClass ||
            (existingBlock as any).bookmark !== (yBlock.get('bookmark') ?? false);

          if (isPropsChanged || isMetadataChanged || existingBlock.order !== i) {
            bulkOps.push({
              updateOne: {
                filter: { _id: existingBlock._id },
                update: {
                  $set: {
                    blockId: uuidToBuffer(validBlockId),
                    _class: springClass,
                    properties: cleanProps,
                    bookmark: yBlock.get('bookmark') ?? false,
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
                bookmark: yBlock.get('bookmark') ?? false,
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

      bulkOps.push(...toDeleteOps);

      console.log(`[Bridge] BulkOps count: ${bulkOps.length} (inserts / updates: ${bulkOps.length - toDeleteOps.length}, deletes: ${toDeleteOps.length})`);

      if (bulkOps.length > 0) {
        console.log(`[Bridge] Writing to MongoDB - Database: ${Block.db.name}, Collection: ${Block.collection.name} `);
        console.log(`[Bridge] Sample operation: `, JSON.stringify(bulkOps[0], null, 2));

        const result = await Block.bulkWrite(bulkOps);
        console.log(`[Bridge] Sync Success for ${noteId}.Updates: ${result.modifiedCount}, Inserts: ${result.insertedCount}, Deletes: ${result.deletedCount} `);
      } else {
        console.log(`[Bridge] No changes to sync for ${noteId}`);
      }

      // Use noteId string directly (not Binary) since Note schema uses String _id
      await Note.updateOne(
        { _id: noteId },
        { $set: { updatedAt: new Date() } }
      );
    } catch (error) {
      console.error(`[Bridge Error] syncToDB failed for ${noteId}: `, error);
    }
  }
}

export default new BridgeService();