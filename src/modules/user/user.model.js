import mongoose from 'mongoose';

const { Schema } = mongoose;

const USER_STATUSES = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  CLOSED: 'closed'
};

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
      maxlength: 255,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format'
      }
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUSES),
      default: USER_STATUSES.ACTIVE,
      index: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    version: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);


userSchema.set('strict', true);

userSchema.pre('findOneAndUpdate', function () {
  this.set({ $inc: { version: 1 } });
});

userSchema.methods.isActive = function () {
  return this.status === USER_STATUSES.ACTIVE;
};

const User = mongoose.model('User', userSchema);

export { User, USER_STATUSES };
export default User;