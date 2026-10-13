import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// Virtual property for plain text password setting
userSchema.virtual('password').set(function (plainPassword) {
  this._plainPassword = plainPassword;
});

// Pre-validate and Pre-save hooks to hash password
userSchema.pre('validate', async function (next) {
  try {
    if (this._plainPassword) {
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(this._plainPassword, salt);
    }
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre('save', async function (next) {
  try {
    if (this.isModified('passwordHash') && !this.passwordHash.startsWith('$2')) {
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Compare entered password with stored hash
userSchema.methods.comparePassword = async function (plainPassword) {
  if (!plainPassword || !this.passwordHash) return false;
  return bcrypt.compare(plainPassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);

export default User;
