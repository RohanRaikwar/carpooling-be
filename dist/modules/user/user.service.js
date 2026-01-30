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
exports.updateProfileService = exports.completeOnBoardingStep1Service = exports.getMeService = void 0;
const Models = __importStar(require("@models"));
const enums = __importStar(require("./user.constants"));
const getMeService = async (userId) => {
    try {
        const user = await Models.UserModel.findOne({ uuid: userId }).select('-password');
        if (!user) {
            return { success: false, user: null, reason: 'User not found' };
        }
        return { success: true, user };
    }
    catch (error) {
        console.error('getMeService error:', error);
        return { success: false, user: null, reason: 'Internal server error' };
    }
};
exports.getMeService = getMeService;
const completeOnBoardingStep1Service = async (userId, data) => {
    try {
        const user = await Models.UserModel.findOne({ uuid: userId });
        if (!user) {
            return { success: false, user: null, reason: 'User not found' };
        }
        if (user.onboardingStatus === enums.OnboardingStatus.COMPLETED) {
            return { success: false, reason: 'Onboarding already completed' };
        }
        user.name = data.name;
        user.salutation = data.salutation;
        user.dob = new Date(data.dob);
        user.onboardingStatus = enums.OnboardingStatus.COMPLETED;
        await user.save();
        return { success: true, user };
    }
    catch (error) {
        console.error('completeOnBoardingStep1Service error:', error);
        return { success: false, user: null, reason: 'Internal server error' };
    }
};
exports.completeOnBoardingStep1Service = completeOnBoardingStep1Service;
const updateProfileService = async (userId, payload) => {
    try {
        const { username } = payload;
        if (username) {
            const exists = await Models.UserModel.findOne({
                username,
                uuid: { $ne: userId },
            });
            if (exists) {
                return { success: false, reason: 'USERNAME_EXISTS' };
            }
        }
        const updatedUser = await Models.UserModel.findOneAndUpdate({ uuid: userId }, payload, {
            new: true,
            runValidators: true,
        });
        if (!updatedUser) {
            return { success: false, reason: 'User not found' };
        }
        return { success: true, user: updatedUser };
    }
    catch (error) {
        console.error('updateProfileService error:', error);
        return { success: false, reason: 'Internal server error' };
    }
};
exports.updateProfileService = updateProfileService;
