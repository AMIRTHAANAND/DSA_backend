import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  question: string;
  type: 'multiple-choice' | 'true-false' | 'fill-in-blank' | 'code-completion';
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export interface IQuiz extends Document {
  title: string;
  description: string;
  category: 'data-structures' | 'algorithms' | 'concepts' | 'mixed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: IQuestion[];
  timeLimit: number; // in minutes, 0 means no limit
  passingScore: number; // percentage
  maxAttempts: number; // 0 means unlimited
  isPublished: boolean;
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>({
  question: {
    type: String,
    required: [true, 'Question text is required']
  },
  type: {
    type: String,
    required: true,
    enum: ['multiple-choice', 'true-false', 'fill-in-blank', 'code-completion']
  },
  options: [String], // For multiple choice questions
  correctAnswer: {
    type: Schema.Types.Mixed,
    required: [true, 'Correct answer is required']
  },
  explanation: {
    type: String,
    required: [true, 'Explanation is required']
  },
  points: {
    type: Number,
    required: true,
    min: [1, 'Points must be at least 1'],
    default: 1
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  tags: [String]
});

const quizSchema = new Schema<IQuiz>({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Quiz description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: true,
    enum: ['data-structures', 'algorithms', 'concepts', 'mixed']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  questions: [questionSchema],
  timeLimit: {
    type: Number,
    default: 0, // No time limit
    min: [0, 'Time limit cannot be negative']
  },
  passingScore: {
    type: Number,
    required: true,
    min: [0, 'Passing score cannot be negative'],
    max: [100, 'Passing score cannot exceed 100'],
    default: 70
  },
  maxAttempts: {
    type: Number,
    default: 0, // Unlimited attempts
    min: [0, 'Max attempts cannot be negative']
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
quizSchema.index({ title: 1 });
quizSchema.index({ category: 1, difficulty: 1 });
quizSchema.index({ tags: 1 });
quizSchema.index({ isPublished: 1 });
quizSchema.index({ createdBy: 1 });

// Virtual for total points
quizSchema.virtual('totalPoints').get(function() {
  return this.questions.reduce((total, question) => total + question.points, 0);
});

// Virtual for questions count
quizSchema.virtual('questionsCount').get(function() {
  return this.questions.length;
});

// Virtual for estimated completion time
quizSchema.virtual('estimatedTime').get(function() {
  if (this.timeLimit > 0) {
    return this.timeLimit;
  }
  // Estimate 2 minutes per question if no time limit
  return this.questions.length * 2;
});

// Ensure virtual fields are serialized
quizSchema.set('toJSON', {
  virtuals: true
});

export default mongoose.model<IQuiz>('Quiz', quizSchema);

