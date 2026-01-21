"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.completeOnBoardingStep1 = exports.getMe = void 0;
const Models = __importStar(require("../models"));
const enums = __importStar(require("../constants/enums"));
const getMe = async (req, res) => {
    try {
        const user = await Models.UserModel.findOne({ uuid: req.user.id }).select('-password');
        if (user) {
            res.json(user);
        }
        else {
            res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getMe = getMe;
const completeOnBoardingStep1 = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, salutation, dob } = req.body;
        console.log('user before update:', userId);
        const user = await Models.UserModel.findOne({ uuid: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.name = name;
        user.salutation = salutation;
        user.dob = new Date(dob);
        user.onboardingStatus = enums.OnboardingStatus.COMPLETED;
        await user.save();
        res.status(200).json({
            message: 'Onboarding completed successfully',
            user: {
                id: user.uuid,
                name: user.name,
                email: user.email,
                role: 'USER',
            },
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.completeOnBoardingStep1 = completeOnBoardingStep1;
const updateProfile = async (req, res) => {
    try {
        const { bio, username, gender, dob, preferences } = req.body;
        const userId = req.user.id;
        // Check username uniqueness if updating
        if (username) {
            const existingUser = await Models.UserModel.findOne({ username, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(409).json({ message: 'Username already taken' });
            }
        }
        const updatedUser = await Models.UserModel.findByIdAndUpdate(userId, {
            bio,
            username,
            gender,
            dob,
            preferences,
        }, { new: true, runValidators: true });
        res.json(updatedUser);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateProfile = updateProfile;
