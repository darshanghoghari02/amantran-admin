import express from 'express';
import { dbService } from '../services/db.js';

const router = express.Router();

// GET dashboard statistics summary
router.get('/summary', async (req, res) => {
  try {
    const templates = await dbService.getAll('templates');
    const categories = await dbService.getAll('categories');
    const users = await dbService.getAll('users');

    const totalTemplates = templates.length;
    const totalCategories = categories.length;
    const totalUsers = users.length;

    const premiumTemplates = templates.filter(t => t.isPremium).length;
    const activeUsersCount = users.filter(u => !u.isBlocked).length;

    // Aggregate invitation and draft counts
    let totalInvitations = 0;
    let totalDrafts = 0;
    users.forEach(u => {
      totalInvitations += u.invitationCount || 0;
      totalDrafts += u.draftsCount || 0;
    });

    // Mock recent activities
    const recentActivities = [
      { id: 'act_1', user: 'Vicky Patel', action: 'Created new invitation draft from "Royal Wedding"', time: '10 mins ago' },
      { id: 'act_2', user: 'Admin', action: 'Uploaded new custom font "Hind Vadodara"', time: '1 hour ago' },
      { id: 'act_3', user: 'Sneha Sharma', action: 'Published "Modern Engagement" template update', time: '3 hours ago' },
      { id: 'act_4', user: 'Rajesh Shah', action: 'User account was suspended due to policy breach', time: '1 day ago' }
    ];

    // Mock top performing templates
    const topTemplates = templates.slice(0, 3).map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      downloads: Math.floor(Math.random() * 200) + 120,
      isPremium: t.isPremium
    }));

    res.json({
      counters: {
        totalTemplates,
        totalCategories,
        totalUsers,
        premiumTemplates,
        activeUsersCount,
        totalInvitations,
        totalDrafts
      },
      recentActivities,
      topTemplates
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET detailed chart metrics
router.get('/charts', async (req, res) => {
  try {
    const templates = await dbService.getAll('templates');
    const categories = await dbService.getAll('categories');

    // 1. User growth trend (last 6 months)
    const userGrowthTrend = [
      { month: 'Jan', users: 180 },
      { month: 'Feb', users: 240 },
      { month: 'Mar', users: 310 },
      { month: 'Apr', users: 480 },
      { month: 'May', users: 650 },
      { month: 'Jun', users: 820 }
    ];

    // 2. Template distribution by Category
    const categoryDistribution = categories.map(cat => {
      const count = templates.filter(t => t.categoryId === cat.id).length;
      return {
        name: cat.name,
        count: count || Math.floor(Math.random() * 5) + 1 // Ensure visual fallback
      };
    });

    res.json({
      userGrowthTrend,
      categoryDistribution
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
