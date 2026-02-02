import mongoose, { Schema, Document } from 'mongoose';

// 1. 블록 내부 속성 (properties) 타입 정의
export interface BlockProperties {
  [key: string]: any;
  content?: string;
  code?: string;
  language?: string;
  version?: string;       // CodeBlock
  executionMode?: string; // CodeBlock
  src?: string;
  caption?: string;
  attributes?: {          // TextBlock attributes
    align?: string;
    color?: string;
    bold?: boolean;
    [key: string]: any;
  };
}

// 2. Block 문서 인터페이스 (Java BaseBlock 대응)
export interface IBlock extends Document {
  _class: string;
  noteId: string;
  blockId: string;
  type: string;
  properties: BlockProperties;
  order: number;

  // CodeBlock specific fields (Root Level)
  outputHistory?: Array<{
    output: string;
    executedAt: Date;
    executionTimeMs: number;
    status: string;
  }>;
  lastOutput?: string;
  lastExecutedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// 3. BlockHistory 인터페이스 (슬롯 기반)
export interface IBlockHistory extends Document {
  blockId: string;
  noteId: string;
  slotNumber: number;

  properties: BlockProperties;
  blockType: string;

  changedBy: {
    memberId: string;
    memberName: string;
  };

  changedAt: Date;
  changeDescription?: string;
}

// 4. Mongoose Schema 정의
const BlockSchema: Schema = new Schema({
  _class: { type: String, required: true },
  noteId: { type: String, required: true, index: true },
  blockId: { type: String, required: true, unique: true },
  type: { type: String, required: true },

  // Java의 @Field("properties.xxx")와 매핑됨
  properties: { type: Schema.Types.Mixed, default: {} },

  // CodeBlock용 Root Level Fields
  outputHistory: { type: [Schema.Types.Mixed], default: undefined },
  lastOutput: { type: String },
  lastExecutedAt: { type: Date },

  order: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'blocks'
});

const BlockHistorySchema: Schema = new Schema({
  blockId: { type: String, required: true, index: true },
  noteId: { type: String, required: true, index: true },
  slotNumber: { type: Number, required: true, min: 1, max: 5 },

  properties: { type: Object, required: true },
  blockType: { type: String, required: true },

  changedBy: {
    memberId: { type: String, required: true },
    memberName: { type: String, required: true }
  },

  changedAt: { type: Date, default: Date.now },
  changeDescription: { type: String }
}, {
  collection: 'block_histories'
});

// 복합 인덱스 추가 (슬롯 기반)
BlockHistorySchema.index({ blockId: 1, slotNumber: 1 }, { unique: true });
BlockHistorySchema.index({ noteId: 1, changedAt: -1 });
BlockHistorySchema.index({ 'changedBy.memberId': 1, changedAt: -1 });

export const Block = mongoose.model<IBlock>('Block', BlockSchema);
export const BlockHistory = mongoose.model<IBlockHistory>('BlockHistory', BlockHistorySchema);