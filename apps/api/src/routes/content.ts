import { Router } from "express";
import { prisma } from "../prisma.js";
import { env } from "../env.js";

export const contentRouter = Router();

function parseLanguage(value: unknown) {
  return value === "ka" || value === "en" || value === "ru" ? value : "ru";
}

contentRouter.get("/", async (req, res, next) => {
  try {
    const languageCode = parseLanguage(req.query.lang);
    const now = new Date();
    const [posts, coaches] = await Promise.all([
      prisma.contentPost.findMany({
        where: {
          projectKey: env.projectKey,
          isPublished: true,
          languageCode,
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }]
        },
        orderBy: { createdAt: "desc" },
        take: 60
      }),
      prisma.coach.findMany({
        where: { projectKey: env.projectKey, isActive: true },
        orderBy: { createdAt: "desc" },
        take: 60
      })
    ]);

    res.json({
      posts: posts.map((post) => ({ ...post, imageData: undefined, hasImage: Boolean(post.imageData) })),
      coaches: coaches.map((coach) => ({ ...coach, photoData: undefined, hasPhoto: Boolean(coach.photoData) }))
    });
  } catch (error) {
    next(error);
  }
});

contentRouter.get("/posts/:id/image", async (req, res, next) => {
  try {
    const post = await prisma.contentPost.findFirst({
      where: { id: req.params.id, projectKey: env.projectKey }
    });
    if (!post?.imageData || !post.imageMimeType) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    res.setHeader("Content-Type", post.imageMimeType);
    res.setHeader("Content-Disposition", `inline; filename="${post.imageFileName ?? "post-image"}"`);
    res.send(Buffer.from(post.imageData));
  } catch (error) {
    next(error);
  }
});

contentRouter.get("/coaches/:id/photo", async (req, res, next) => {
  try {
    const coach = await prisma.coach.findFirst({
      where: { id: req.params.id, projectKey: env.projectKey }
    });
    if (!coach?.photoData || !coach.photoMimeType) {
      res.status(404).json({ error: "Photo not found" });
      return;
    }
    res.setHeader("Content-Type", coach.photoMimeType);
    res.setHeader("Content-Disposition", `inline; filename="${coach.photoFileName ?? "coach-photo"}"`);
    res.send(Buffer.from(coach.photoData));
  } catch (error) {
    next(error);
  }
});
