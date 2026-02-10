import { prisma } from './src/config/index.js';

async function main() {
    const email = 'testuser@example.com';
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                name: 'Test User',
                onboardingStatus: 'COMPLETED',
                isVerified: true,
            },
        });
        console.log('✅ Created test user:', user.email, 'ID:', user.id);
    } else {
        console.log('ℹ️ Test user already exists:', user.email, 'ID:', user.id);
    }

    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
