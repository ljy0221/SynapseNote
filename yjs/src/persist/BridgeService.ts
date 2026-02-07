import * as Y from 'yjs';
import { Block } from '../models/Block';
import { Note } from '../models/Note';
import { Binary } from 'mongodb';
import * as _ from 'lodash';
import * as crypto from 'crypto';
import * as htmlparser2 from 'htmlparser2';
import { DomHandler, Element, Text as DomText } from 'domhandler';

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


/**
 * Convert HTML string to Yjs XmlFragment using htmlparser2
 * This properly handles complex nested HTML structures
 */
function htmlToXmlFragment(html: string): Y.XmlFragment {
  const fragment = new Y.XmlFragment();

  if (!html || !html.trim()) {
    return fragment;
  }

  // Parse HTML using htmlparser2
  const handler = new DomHandler();
  const parser = new htmlparser2.Parser(handler);
  parser.write(html);
  parser.end();

  // Convert DOM nodes to Yjs XmlElements
  const convertNode = (node: any, parent: Y.XmlFragment | Y.XmlElement) => {
    if (node.type === 'text') {
      // Text node
      const textNode = node as DomText;
      if (textNode.data) {
        const yText = new Y.XmlText(textNode.data);
        parent.push([yText]);
      }
    } else if (node.type === 'tag') {
      // Element node
      const element = node as Element;
      const yElement = new Y.XmlElement(element.name);

      // Copy attributes
      if (element.attribs) {
        Object.entries(element.attribs).forEach(([key, value]) => {
          yElement.setAttribute(key, value);
        });
      }

      // Recursively convert children
      if (element.children && element.children.length > 0) {
        element.children.forEach(child => convertNode(child, yElement));
      }

      parent.push([yElement]);
    }
  };

  // Convert all root nodes
  handler.dom.forEach(node => convertNode(node, fragment));

  return fragment;
}

interface UserContext {
  userId: string;
  name: string;
}

/**
 * Convert Y.XmlFragment to HTML string, preserving all tags
 * This is crucial for saving AI review results with proper formatting
 */
function xmlFragmentToHtml(fragment: Y.XmlFragment): string {
  const parts: string[] = [];

  fragment.forEach((item: any) => {
    if (item instanceof Y.XmlElement) {
      parts.push(xmlElementToHtml(item));
    } else if (item instanceof Y.XmlText) {
      parts.push(item.toString());
    }
  });

  return parts.join('');
}

/**
 * Convert Y.XmlElement to HTML string recursively
 * Maps TipTap internal node names to standard HTML tags
 */
function xmlElementToHtml(element: Y.XmlElement): string {
  let tagName = element.nodeName;

  // Map TipTap node names to standard HTML tags
  const nodeToHtmlMap: Record<string, string> = {
    'paragraph': 'p',
    'heading': 'h1', // Will be overridden by level attribute
    'bulletList': 'ul',
    'orderedList': 'ol',
    'listItem': 'li',
    'blockquote': 'blockquote',
    'codeBlock': 'pre',
    'horizontalRule': 'hr',
    'hardBreak': 'br',
    'bold': 'strong',
    'italic': 'em',
    'strike': 's',
    'underline': 'u',
    'link': 'a',
    'highlight': 'mark',  // TipTap highlight -> HTML mark
    'textStyle': 'span',  // TipTap textStyle -> HTML span
  };

  // Convert TipTap node name to HTML tag
  if (nodeToHtmlMap[tagName]) {
    const originalTag = tagName;
    tagName = nodeToHtmlMap[tagName];
    console.log(`[Bridge] Converting node: ${originalTag} -> ${tagName}`);
  } else {
    console.warn(`[Bridge] Unknown TipTap node: ${tagName}, keeping as-is`);
  }

  // Collect attributes
  const attributes: string[] = [];

  // [New] For heading nodes, check level attribute (1-6)
  if (element.nodeName === 'heading') {
    try {
      // TipTap heading nodes have a level attribute (1-6)
      // Try to access it safely
      const attrs: any = element.getAttributes ? element.getAttributes() : null;
      if (attrs) {
        const level = typeof attrs.get === 'function' ? attrs.get('level') : attrs.level;
        if (level && level >= 1 && level <= 6) {
          tagName = `h${level}`;
        }
      }
    } catch (e) {
      // Fallback to h1 if attribute reading fails
      console.warn('[Bridge] Failed to read heading level, defaulting to h1:', e);
      tagName = 'h1';
    }
  }

  // [New] For highlight nodes, preserve color attribute
  if (element.nodeName === 'highlight') {
    try {
      const attrs: any = element.getAttributes ? element.getAttributes() : null;
      if (attrs) {
        const color = typeof attrs.get === 'function' ? attrs.get('color') : attrs.color;
        if (color) {
          attributes.push(`style="background-color: ${color}"`);
        }
      }
    } catch (e) {
      console.warn('[Bridge] Failed to read highlight color:', e);
    }
  }

  // [New] For textStyle nodes, preserve color attribute
  if (element.nodeName === 'textStyle') {
    try {
      const attrs: any = element.getAttributes ? element.getAttributes() : null;
      if (attrs) {
        const color = typeof attrs.get === 'function' ? attrs.get('color') : attrs.color;
        if (color) {
          attributes.push(`style="color: ${color}"`);
        }
      }
    } catch (e) {
      console.warn('[Bridge] Failed to read textStyle color:', e);
    }
  }

  // Get children content
  const children: string[] = [];
  element.forEach((child: any) => {
    if (child instanceof Y.XmlElement) {
      children.push(xmlElementToHtml(child));
    } else if (child instanceof Y.XmlText) {
      // [Fix] TipTap's Collaboration extension stores marks as formatting on XmlText
      // We need to read these formatting attributes and wrap the text with appropriate HTML tags
      let text = child.toString();

      // Get formatting attributes (marks) from XmlText
      const formatting = child.getAttributes ? child.getAttributes() : {};

      // Wrap text with HTML tags based on formatting
      // Order matters: innermost tags first
      if (formatting.code) text = `<code>${text}</code>`;
      if (formatting.link) text = `<a href="${formatting.link.href}">${text}</a>`;
      if (formatting.bold) text = `<strong>${text}</strong>`;
      if (formatting.italic) text = `<em>${text}</em>`;
      if (formatting.strike) text = `<s>${text}</s>`;
      if (formatting.underline) text = `<u>${text}</u>`;
      if (formatting.highlight) {
        const color = formatting.highlight.color || '#fef08a';
        text = `<mark style="background-color: ${color}">${text}</mark>`;
      }
      if (formatting.textStyle && formatting.textStyle.color) {
        text = `<span style="color: ${formatting.textStyle.color}">${text}</span>`;
      }

      children.push(text);
    }
  });

  const content = children.join('');
  const attrString = attributes.length > 0 ? ' ' + attributes.join(' ') : '';

  // Self-closing tags
  if (['br', 'hr', 'img'].includes(tagName)) {
    return `<${tagName}>`;
  }

  // [Modified] Skip empty paragraphs to avoid unnecessary <p><br></p>
  // Only keep them if they're intentionally placed between content blocks
  if (tagName === 'p' && !content.trim()) {
    return ''; // Remove empty paragraphs
  }

  return `<${tagName}${attrString}>${content}</${tagName}>`;
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
              // [Fix] For text blocks, convert HTML string to XmlFragment
              if (block._class === 'text' && k === 'content' && typeof v === 'string') {
                const fragment = htmlToXmlFragment(v);
                props.set('content', fragment);
                props.set('_initialHtml', v);
                props.set('rawHtml', v);
                console.log(`[Bridge] Converted HTML to XmlFragment for text block, HTML length: ${v.length}, Fragment length: ${fragment.length}`);
                return; // Skip the default props.set below
              }

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
            // [Fix] Skip XmlFragment conversion for rawHtml - it should remain as plain HTML string
            if (key === 'rawHtml' && typeof val === 'string') {
              cleanProps[key] = val;
              return;
            }

            if (val instanceof Y.XmlFragment) {
              // [Fix] Convert XmlFragment to HTML to preserve all tags (h1, h2, strong, etc.)
              // This is essential for AI review results and formatted content
              const htmlContent = xmlFragmentToHtml(val);
              cleanProps[key] = htmlContent;
              console.log(`[Bridge] Converted XmlFragment to HTML for key "${key}", length: ${htmlContent.length}`);
            } else if (val instanceof Y.Text || val instanceof Y.XmlElement) {
              // For other Yjs types, use toString
              cleanProps[key] = val.toString();
            } else if (val && typeof val.toJSON === 'function') {
              cleanProps[key] = val.toJSON();
            } else {
              cleanProps[key] = val;
            }
          });

          // [New] If rawHtml exists and has content, use it as the content source for text blocks
          // rawHtml contains properly formatted HTML (e.g., <strong><s>text</s></strong>)
          // while XmlFragment conversion may produce TipTap node names (e.g., <bold><strike>text</strike></bold>)
          if (cleanProps.rawHtml && cleanProps.rawHtml.trim() && springClass === 'text') {
            cleanProps.content = cleanProps.rawHtml;
            console.log(`[Bridge] Using rawHtml as content for text block, length: ${cleanProps.rawHtml.length}`);
          }
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