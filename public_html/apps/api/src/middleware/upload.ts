import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@pariaza/database';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';

export async function handleAvatarUpload(request: FastifyRequest, reply: FastifyReply) {
    try {
        const data = await request.file();

        if (!data) {
            return reply.code(400).send({ error: 'No file uploaded' });
        }

        // Validate MIME type
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(data.mimetype)) {
            return reply.code(400).send({ error: 'Format invalid. Folosește JPG, PNG sau WebP.' });
        }

        const userId = (request as any).user.id;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');

        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Delete old avatar if exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { avatarUrl: true }
        });

        if (user?.avatarUrl) {
            const oldFilename = user.avatarUrl.split('/').pop();
            if (oldFilename) {
                const oldPath = path.join(uploadDir, oldFilename);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
        }

        // Save new file
        const ext = path.extname(data.filename);
        const filename = `${userId}${ext}`;
        const filepath = path.join(uploadDir, filename);

        await pipeline(data.file, createWriteStream(filepath));

        // Update database with CUSTOM avatar type
        const avatarUrl = `/uploads/avatars/${filename}`;
        await prisma.user.update({
            where: { id: userId },
            data: {
                avatarType: 'CUSTOM',
                avatarUrl: avatarUrl
            }
        });

        // Return full URL (not relative)
        const avatarFinalUrl = `http://localhost:3001${avatarUrl}`;

        return reply.send({
            success: true,
            avatarUrl: avatarFinalUrl, // Full URL for immediate display
            message: 'Avatar uploaded successfully'
        });
    } catch (error: any) {
        request.log.error('Error uploading avatar:', error);
        return reply.code(500).send({ error: 'Internal server error' });
    }
}
