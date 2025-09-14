import mongoose, { Document, Schema } from 'mongoose';

export interface ICodeSnippet {
  language: string;
  code: string;
  explanation: string;
}

export interface IComplexity {
  time: string;
  space: string;
  bestCase?: string;
  worstCase?: string;
  averageCase?: string;
}

export interface IVisualization {
  type: 'array' | 'tree' | 'graph' | 'linkedlist' | 'custom';
  data: any;
  steps: any[];
}

export interface ITopic extends Document {
  title: string;
  slug: string;
  description: string;
  category: 'data-structures' | 'algorithms' | 'concepts';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: {
    overview: string;
    explanation: string;
    pseudocode: string;
    codeSnippets: ICodeSnippet[];
    complexity: IComplexity;
    examples: string[];
    visualizations: IVisualization[];
    whyItMatters: string;
    realWorldApplications: string[];
  };
  prerequisites: string[];
  relatedTopics: mongoose.Types.ObjectId[];
  estimatedTime: number; // in minutes
  isPublished: boolean;
  order: number;
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const codeSnippetSchema = new Schema<ICodeSnippet>({
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

const complexitySchema = new Schema<IComplexity>({
  time: {
    type: String,
    required: true
  },
  space: {
    type: String,
    required: true
  },
  bestCase: String,
  worstCase: String,
  averageCase: String
});

const visualizationSchema = new Schema<IVisualization>({
  type: {
    type: String,
    required: true,
    enum: ['array', 'tree', 'graph', 'linkedlist', 'custom']
  },
  data: Schema.Types.Mixed,
  steps: [Schema.Types.Mixed]
});

const topicSchema = new Schema<ITopic>(
  {
    title: {
      type: String,
      required: [true, 'Topic title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    slug: {
      type: String,
      required: true,
      unique: true, // 👈 already ensures index
      lowercase: true
    },
    description: {
      type: String,
      required: [true, 'Topic description is required'],
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    category: {
      type: String,
      required: true,
      enum: ['data-structures', 'algorithms', 'concepts']
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['beginner', 'intermediate', 'advanced']
    },
    content: {
      overview: {
        type: String,
        required: true
      },
      explanation: {
        type: String,
        required: true
      },
      pseudocode: {
        type: String,
        required: true
      },
      codeSnippets: [codeSnippetSchema],
      complexity: {
        type: complexitySchema,
        required: true
      },
      examples: [String],
      visualizations: [visualizationSchema],
      whyItMatters: {
        type: String,
        required: true
      },
      realWorldApplications: [String]
    },
    prerequisites: [String],
    relatedTopics: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Topic'
      }
    ],
    estimatedTime: {
      type: Number,
      required: true,
      min: [1, 'Estimated time must be at least 1 minute']
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
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
  },
  {
    timestamps: true
  }
);

// ✅ Removed duplicate `slug` index
// Keep only these:
topicSchema.index({ category: 1, difficulty: 1 });
topicSchema.index({ tags: 1 });
topicSchema.index({ isPublished: 1, order: 1 });

// Virtual for full content length
topicSchema.virtual('contentLength').get(function () {
  return this.content.explanation.length + this.content.overview.length;
});

// Ensure virtual fields are serialized
topicSchema.set('toJSON', {
  virtuals: true
});

export default mongoose.model<ITopic>('Topic', topicSchema);
