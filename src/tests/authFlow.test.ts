import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';

// Mock Redis
jest.mock('../config/redis', () => ({
    __esModule: true,
    default: {
        connect: jest.fn(),
        on: jest.fn(),
        setEx: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
        incr: jest.fn(),
        expire: jest.fn(),
    },
    connectRedis: jest.fn(),
}));

// Mock Auth Service
jest.mock('../services/authService', () => ({
    __esModule: true,
    sendOTP: jest.fn(),
    generateTokens: jest.fn().mockResolvedValue({
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
    }),
}));

// Mock OTP Service
jest.mock('../services/otpService', () => ({
    __esModule: true,
    generateOTP: jest.fn().mockReturnValue('123456'),
    storeOTP: jest.fn(),
    verifyOTP: jest.fn().mockResolvedValue(true),
    checkRateLimit: jest.fn().mockResolvedValue(true),
}));

// Mock Mongoose Models
jest.mock('../models/User');
jest.mock('../models/RefreshToken');

describe('Auth Flow Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should signup a new user with email', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({
            _id: 'mock_user_id',
            email: 'test@example.com',
            name: 'Test User',
            status: 'pending',
            isVerified: false,
        });

        const res = await request(app)
            .post('/api/v1/auth/signup')
            .send({
                method: 'email',
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            });

        console.log('Signup Body:', res.body);
        expect(res.status).toBe(201);
        expect(res.body.message).toContain('Signup successful');
        expect(res.body.next).toBe('verify_otp');
    });

    it('should verify OTP and return tokens', async () => {
        (User.findOne as jest.Mock).mockResolvedValue({
            _id: 'mock_user_id',
            email: 'test@example.com',
            name: 'Test User',
            status: 'pending',
            isVerified: false,
            save: jest.fn(),
            role: 'user',
        });

        const res = await request(app)
            .post('/api/v1/auth/otp/verify')
            .send({
                method: 'email',
                identifier: 'test@example.com',
                code: '123456',
                purpose: 'signup',
            });

        console.log('Verify Body:', res.body);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Verification successful');
        expect(res.body.accessToken).toBe('mock_access_token');
    });

    it('should login with password', async () => {
        const mockUser = {
            _id: 'mock_user_id',
            email: 'test@example.com',
            name: 'Test User',
            status: 'active',
            isVerified: true,
            password: 'hashed_password',
            role: 'user',
            comparePassword: jest.fn().mockResolvedValue(true),
        };

        // Mock chainable select
        const mockFindOne = jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUser),
        });
        (User.findOne as jest.Mock) = mockFindOne;

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                method: 'email',
                identifier: 'test@example.com',
                password: 'password123',
            });

        console.log('Login Body:', res.body);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Login successful');
        expect(res.body.accessToken).toBe('mock_access_token');
    });
});
