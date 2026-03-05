import { Category } from '../models/category.model';

// Sample job categories with emojis and colors
const sampleCategories = [
  {
    name: 'Information Technology',
    description: 'Software development, IT support, and tech-related roles',
    icon: '💻',
    color: '#3B82F6', // Blue
    isActive: true,
  },
  {
    name: 'Finance & Accounting',
    description: 'Financial analysis, accounting, and banking positions',
    icon: '💰',
    color: '#10B981', // Green
    isActive: true,
  },
  {
    name: 'Human Resources',
    description: 'HR management, recruitment, and employee relations',
    icon: '👥',
    color: '#F59E0B', // Amber
    isActive: true,
  },
  {
    name: 'Engineering',
    description: 'Civil, mechanical, and electrical engineering roles',
    icon: '🔧',
    color: '#EF4444', // Red
    isActive: true,
  },
  {
    name: 'Marketing & Sales',
    description: 'Marketing, sales, and business development positions',
    icon: '📈',
    color: '#EC4899', // Pink
    isActive: true,
  },
  {
    name: 'Healthcare',
    description: 'Medical, nursing, and healthcare professional roles',
    icon: '⚕️',
    color: '#06B6D4', // Cyan
    isActive: true,
  },
  {
    name: 'Manufacturing',
    description: 'Production, quality control, and manufacturing roles',
    icon: '🏭',
    color: '#8B5CF6', // Purple
    isActive: true,
  },
  {
    name: 'Education',
    description: 'Teaching, training, and educational positions',
    icon: '📚',
    color: '#6366F1', // Indigo
    isActive: true,
  },
  {
    name: 'Legal',
    description: 'Law, compliance, and legal advisory roles',
    icon: '⚖️',
    color: '#6B7280', // Gray
    isActive: true,
  },
  {
    name: 'Hospitality & Tourism',
    description: 'Hotel management, tourism, and hospitality roles',
    icon: '🏨',
    color: '#D97706', // Orange
    isActive: true,
  },
];

/**
 * Seeds the database with default job categories
 * Run this once to populate the categories collection
 */
export async function seedCategories() {
  try {
    // Check if categories already exist
    const existingCount = await Category.countDocuments();
    if (existingCount > 0) {
      console.log(` Categories already seeded (${existingCount} categories found)`);
      return;
    }

    // Insert sample categories
    const insertedCategories = await Category.insertMany(sampleCategories);
    console.log(`Successfully seeded ${insertedCategories.length} job categories`);

    // Log inserted categories
    insertedCategories.forEach((cat) => {
      console.log(`   - ${cat.icon} ${cat.name}`);
    });

    return insertedCategories;
  } catch (error) {
    console.error(' Error seeding categories:', error);
    throw error;
  }
}

/**
 * Clears all categories from the database
 * Use with caution in development only
 */
export async function clearCategories() {
  try {
    const result = await Category.deleteMany({});
    console.log(` Deleted ${result.deletedCount} categories`);
  } catch (error) {
    console.error(' Error clearing categories:', error);
    throw error;
  }
}

/**
 * Resets categories to default state
 * Useful for testing or resetting database state
 */
export async function resetCategories() {
  try {
    await clearCategories();
    await seedCategories();
    console.log('Categories reset to default state');
  } catch (error) {
    console.error('Error resetting categories:', error);
    throw error;
  }
}
