import { Schema, models, model, type InferSchemaType } from "mongoose";

const FeedPostSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["discussion", "proposal", "notice", "vote", "issue", "meme"],
      required: true,
    },
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    /// Public human id e.g. jnk-250721-kqm-0001 (not Mongo _id)
    publicId: { type: String, unique: true, sparse: true },
    author: { type: String, default: "Citizen" },
    authorAnonId: { type: String },
    href: { type: String, required: true },
    meta: { type: String, default: "" },
    votes: { type: Number, default: 0 },
    hot: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    refId: { type: String }, // sqlite id / slug when linked
    body: { type: String },
    mediaUrl: { type: String },
    mediaType: {
      type: String,
      enum: ["image", "gif", "video"],
    },
    /// Optional geographic scope for location filters
    locationLevel: { type: String },
    village: { type: String },
    town: { type: String },
    city: { type: String },
    district: { type: String },
    state: { type: String },
    country: { type: String },
  },
  { timestamps: true },
);

FeedPostSchema.index({ createdAt: -1 });
FeedPostSchema.index({ hot: -1, votes: -1 });
FeedPostSchema.index({ tags: 1 });
FeedPostSchema.index({ authorAnonId: 1, createdAt: -1 });
FeedPostSchema.index({ state: 1, district: 1, city: 1 });
FeedPostSchema.index({ country: 1, state: 1 });
FeedPostSchema.index({ publicId: 1 }, { unique: true, sparse: true });

const DiscussionSchema = new Schema(
  {
    issueSlug: { type: String },
    feedPostId: { type: String },
    author: { type: String, required: true },
    authorAnonId: { type: String },
    authorHash: { type: String }, // private — never expose in public API
    body: { type: String, required: true },
    mediaUrl: { type: String },
    mediaType: {
      type: String,
      enum: ["image", "gif", "video"],
    },
    kind: {
      type: String,
      enum: ["opinion", "evidence", "news"],
      default: "opinion",
    },
    upvotes: { type: Number, default: 0 },
    voters: { type: [String], default: [] }, // voterKeys who upvoted
  },
  { timestamps: true },
);

DiscussionSchema.index({ issueSlug: 1, createdAt: -1 });
DiscussionSchema.index({ feedPostId: 1, createdAt: -1 });
DiscussionSchema.index({ authorAnonId: 1, createdAt: -1 });

const TrendSchema = new Schema(
  {
    term: { type: String, required: true, unique: true },
    score: { type: Number, default: 1 },
    category: { type: String },
  },
  { timestamps: true },
);

TrendSchema.index({ score: -1 });

const StateSignalSchema = new Schema(
  {
    state: { type: String, required: true, unique: true },
    topIssue: { type: String, required: true },
    rating: { type: Number, default: 4 },
    voteWeight: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const ActivitySchema = new Schema(
  {
    kind: {
      type: String,
      enum: [
        "vote",
        "notice",
        "discussion",
        "share",
        "proposal",
        "issue",
        "meme",
      ],
      required: true,
    },
    summary: { type: String, required: true },
    href: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

ActivitySchema.index({ createdAt: -1 });

const PlatformStatsSchema = new Schema(
  {
    key: { type: String, unique: true, default: "global" },
    citizens: { type: Number, default: 0 },
    activeProposals: { type: Number, default: 0 },
    votes: { type: Number, default: 0 },
    notices: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type FeedPostDoc = InferSchemaType<typeof FeedPostSchema> & {
  _id: string;
};
export type DiscussionDoc = InferSchemaType<typeof DiscussionSchema> & {
  _id: string;
};

export const FeedPost =
  models.FeedPost || model("FeedPost", FeedPostSchema);
export const Discussion =
  models.Discussion || model("Discussion", DiscussionSchema);
export const Trend = models.Trend || model("Trend", TrendSchema);
export const StateSignal =
  models.StateSignal || model("StateSignal", StateSignalSchema);
export const Activity =
  models.Activity || model("Activity", ActivitySchema);
export const PlatformStats =
  models.PlatformStats || model("PlatformStats", PlatformStatsSchema);
