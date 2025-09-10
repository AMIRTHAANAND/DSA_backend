import mongoose, { Document, Schema } from 'mongoose';

export interface ITopicProgress {
  topicId: mongoose.Types.ObjectId;
  status: 'not-started' | 'in-progress' | 'completed';
  timeSpent: number;
  lastAccessed: Date;
  completedAt?: Date;
  quizScores: number[];
  assignmentScores: number[];
}

export interface IAssignmentProgress {
  assignmentId: mongoose.Types.ObjectId;
  status: 'not-started' | 'in-progress' | 'submitted' | 'completed';
  submission: {
    code: string;
    language: string;
    submittedAt: Date;
  };
  testResults: {
    passed: number;
    total: number;
    details: Array<{
      testCaseId: string;
      passed: boolean;
      output: string;
      expectedOutput: string;
      executionTime: number;
      memoryUsed: number;
    }>;
  };
  score: number;
  maxScore: number;
  timeSpent: number;
  attempts: number;
  lastAttemptAt?: Date;
  completedAt?: Date;
}

export interface IQuizProgress {
  quizId: mongoose.Types.ObjectId;
  status: 'not-started' | 'in-progress' | 'completed';
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number;
  answers: Array<{
    questionIndex: number;
    userAnswer: string | string[];
    isCorrect: boolean;
    pointsEarned: number;
  }>;
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
  maxAttempts: number;
}

export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  topicProgress: ITopicProgress[];
  assignmentProgress: IAssignmentProgress[];
  quizProgress: IQuizProgress[];
  overallScore: number;
  totalTopics: number;
  completedTopics: number;
  totalAssignments: number;
  completedAssignments: number;
  totalQuizzes: number;
  completedQuizzes: number;
  streakDays: number;
  lastActivityDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const topicProgressSchema = new Schema<ITopicProgress>({
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
  status: { type: String, enum: ['not-started', 'in-progress', 'completed'], default: 'not-started' },
  timeSpent: { type: Number, default: 0, min: 0 },
  lastAccessed: { type: Date, default: Date.now },
  completedAt: Date,
  quizScores: [Number],
  assignmentScores: [Number],
});

const testResultDetailSchema = new Schema({
  testCaseId: String,
  passed: Boolean,
  output: String,
  expectedOutput: String,
  executionTime: Number,
  memoryUsed: Number,
});

const assignmentProgressSchema = new Schema<IAssignmentProgress>({
  assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
  status: { type: String, enum: ['not-started', 'in-progress', 'submitted', 'completed'], default: 'not-started' },
  submission: { code: String, language: String, submittedAt: Date },
  testResults: {
    passed: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    details: [testResultDetailSchema],
  },
  score: { type: Number, default: 0, min: 0 },
  maxScore: { type: Number, required: true },
  timeSpent: { type: Number, default: 0, min: 0 },
  attempts: { type: Number, default: 0, min: 0 },
  lastAttemptAt: Date,
  completedAt: Date,
});

const quizAnswerSchema = new Schema({
  questionIndex: { type: Number, required: true },
  userAnswer: Schema.Types.Mixed,
  isCorrect: { type: Boolean, required: true },
  pointsEarned: { type: Number, required: true },
});

const quizProgressSchema = new Schema<IQuizProgress>({
  quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
  status: { type: String, enum: ['not-started', 'in-progress', 'completed'], default: 'not-started' },
  score: { type: Number, default: 0, min: 0 },
  maxScore: { type: Number, required: true },
  percentage: { type: Number, default: 0, min: 0, max: 100 },
  timeSpent: { type: Number, default: 0, min: 0 },
  answers: [quizAnswerSchema],
  startedAt: Date,
  completedAt: Date,
  attempts: { type: Number, default: 0, min: 0 },
  maxAttempts: { type: Number, default: 0 },
});

const progressSchema = new Schema<IProgress>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // 🔹 removed `unique: true`
  topicProgress: [topicProgressSchema],
  assignmentProgress: [assignmentProgressSchema],
  quizProgress: [quizProgressSchema],
  overallScore: { type: Number, default: 0, min: 0 },
  totalTopics: { type: Number, default: 0 },
  completedTopics: { type: Number, default: 0 },
  totalAssignments: { type: Number, default: 0 },
  completedAssignments: { type: Number, default: 0 },
  totalQuizzes: { type: Number, default: 0 },
  completedQuizzes: { type: Number, default: 0 },
  streakDays: { type: Number, default: 0 },
  lastActivityDate: { type: Date, default: Date.now },
}, { timestamps: true });

// ✅ Keep indexes, no duplicate
progressSchema.index({ userId: 1 });
progressSchema.index({ 'topicProgress.topicId': 1 });
progressSchema.index({ 'assignmentProgress.assignmentId': 1 });
progressSchema.index({ 'quizProgress.quizId': 1 });

progressSchema.virtual('completionPercentage').get(function() {
  const total = this.totalTopics + this.totalAssignments + this.totalQuizzes;
  const completed = this.completedTopics + this.completedAssignments + this.completedQuizzes;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
});

progressSchema.virtual('averageScore').get(function() {
  const totalScore = this.overallScore;
  const totalItems = this.completedTopics + this.completedAssignments + this.completedQuizzes;
  return totalItems > 0 ? Math.round(totalScore / totalItems) : 0;
});

progressSchema.set('toJSON', { virtuals: true });

export default mongoose.model<IProgress>('Progress', progressSchema);
