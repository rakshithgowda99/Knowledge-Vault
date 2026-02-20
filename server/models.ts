import mongoose from 'mongoose';

// ──── User ────
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  hashedPassword: { type: String, required: true },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.hashedPassword; // never expose password
    },
  },
});

export const UserModel = mongoose.model('User', userSchema);

// ──── Article ────
const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: { type: [String], default: [] },
  isPublic: { type: Boolean, default: false },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id.toString();
      if (ret.authorId) ret.authorId = ret.authorId.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

// Text index for efficient search
articleSchema.index({ title: 'text', content: 'text' });

export const ArticleModel = mongoose.model('Article', articleSchema);

// ──── Version ────
const versionSchema = new mongoose.Schema({
  articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  content: { type: String, required: true },
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id.toString();
      if (ret.editedBy) ret.editedBy = ret.editedBy.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

// Index for fast version lookups by article
versionSchema.index({ articleId: 1 });

export const VersionModel = mongoose.model('Version', versionSchema);

// ──── Favorite (per-user) ────
const favoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id.toString();
      ret.userId = ret.userId.toString();
      ret.articleId = ret.articleId.toString();
      delete ret._id;
      delete ret.__v;
    },
  },
});

// Each user can favorite an article only once
favoriteSchema.index({ userId: 1, articleId: 1 }, { unique: true });

export const FavoriteModel = mongoose.model('Favorite', favoriteSchema);
