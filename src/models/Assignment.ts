import mongoose, { Document, Schema } from 'mongoose';

export interface ITestCase {
  input: any;
  expectedOutput: any;
  description?: string;
  isHidden?: boolean;
}

export interface IAssignment extends Document {
  title: string;
  description: string;
  problemStatement: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'arrays' | 'strings' | 'linked-lists' | 'trees' | 'graphs' | 'dynamic-programming' | 'greedy' | 'other';
  constraints: string[];
  examples: {
    input: string;
    output: string;
    explanation: string;
  }[];
  testCases: ITestCase[];
  starterCode: {
    language: string;
    code: string;
  }[];
  solution: {
    language: string;
    code: string;
    explanation: string;
  }[];
  hints: string[];
  timeLimit: number; // in seconds
  memoryLimit: number; // in MB
  points: number;
  isPublished: boolean;
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const testCaseSchema = new Schema<ITestCase>({
  input: {
    type: Schema.Types.Mixed,
    required: true
  },
  expectedOutput: {
    type: Schema.Types.Mixed,
    required: true
  },
  description: String,
  isHidden: {
    type: Boolean,
    default: false
  }
});

const exampleSchema = new Schema({
  input: {
    type: String,
    required: true
  },
  output: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    required: true
  }
});

const starterCodeSchema = new Schema({
  language: {
    type: String,
    required: true,
    enum: ['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp']
  },
  code: {
    type: String,
    required: true
  }
});

const solutionSchema = new Schema({
  language: {
    type: String,
    required: true,
    enum: ['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp']
  },
  code: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    required: true
  }
});

const assignmentSchema = new Schema<IAssignment>({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  problemStatement: {
    type: String,
    required: [true, 'Problem statement is required']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  category: {
    type: String,
    required: true,
    enum: ['arrays', 'strings', 'linked-lists', 'trees', 'graphs', 'dynamic-programming', 'greedy', 'other']
  },
  constraints: [String],
  examples: [exampleSchema],
  testCases: [testCaseSchema],
  starterCode: [starterCodeSchema],
  solution: [solutionSchema],
  hints: [String],
  timeLimit: {
    type: Number,
    default: 1000, // 1 second
    min: [100, 'Time limit must be at least 100ms']
  },
  memoryLimit: {
    type: Number,
    default: 128, // 128 MB
    min: [16, 'Memory limit must be at least 16MB']
  },
  points: {
    type: Number,
    default: 10,
    min: [1, 'Points must be at least 1']
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  tags: [String],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
assignmentSchema.index({ title: 1 });
assignmentSchema.index({ difficulty: 1, category: 1 });
assignmentSchema.index({ tags: 1 });
assignmentSchema.index({ isPublished: 1 });
assignmentSchema.index({ createdBy: 1 });

// Virtual for total test cases count
assignmentSchema.virtual('testCasesCount').get(function() {
  return this.testCases.length;
});

// Virtual for visible test cases
assignmentSchema.virtual('visibleTestCases').get(function() {
  return this.testCases.filter(tc => !tc.isHidden);
});

// Ensure virtual fields are serialized
assignmentSchema.set('toJSON', {
  virtuals: true
});

export default mongoose.model<IAssignment>('Assignment', assignmentSchema);

