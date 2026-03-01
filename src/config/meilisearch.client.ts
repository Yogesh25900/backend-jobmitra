import { MeiliSearch } from "meilisearch";

// Meilisearch client setup
const meiliHost = process.env.MEILI_HOST || "http://127.0.0.1:7700";
const meiliApiKey = process.env.MEILI_API_KEY || "pv0rTrtWu60HnK9CjuiKp7fArDhAMyu6Huf6R5kX_xA";

console.log(`[Meilisearch] Connecting to ${meiliHost}`);

export const meiliClient = new MeiliSearch({
  host: meiliHost,
  apiKey: meiliApiKey,
});

// Jobs index
export const jobIndex = meiliClient.index("jobs");

// Health check function
export const checkMeilisearchHealth = async (): Promise<boolean> => {
  try {
    const health = await meiliClient.health();
    console.log('[Meilisearch] Health check passed');
    return true;
  } catch (error: any) {
    console.error('[Meilisearch] Health check failed:', error.message);
    return false;
  }
};

// Initialize Meilisearch without blocking startup
export const initMeilisearch = async (): Promise<void> => {
  try {
    console.log('[Meilisearch] Attempting to connect...');
    const isHealthy = await checkMeilisearchHealth();
    
    if (!isHealthy) {
      console.warn('[Meilisearch] WARNING: Meilisearch is not responding. Search will not work.');
      console.warn('[Meilisearch] Make sure Meilisearch is running on', meiliHost);
      return;
    }
    
    // Check if jobs index exists, if not create it
    try {
      const jobsIndex = meiliClient.index('jobs');
      // Try to get index stats - if it fails, index doesn't exist
      await jobsIndex.getStats();
      console.log('[Meilisearch] Jobs index exists');
    } catch (indexError: any) {
      console.log('[Meilisearch] Creating jobs index...');
      await meiliClient.createIndex('jobs', { primaryKey: 'id' });
      console.log('[Meilisearch] Jobs index created');
    }

    // Update filterable attributes to include jobCategory._id
    try {
      // First check current filterable attributes
      const currentFilterable = await jobIndex.getFilterableAttributes();
      console.log('[Meilisearch] Current filterable attributes:', currentFilterable);
      
      await jobIndex.updateFilterableAttributes([
        'employerId',
        'experienceLevel', 
        'jobLocation',
        'jobType',
        'status',
        'tags',
        'jobCategory._id'
      ]);
      console.log('[Meilisearch] Filterable attributes updated with jobCategory._id');
      
      // Wait a moment for the settings to apply
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify the update
      const updatedFilterable = await jobIndex.getFilterableAttributes();
      console.log('[Meilisearch] Updated filterable attributes:', updatedFilterable);
    } catch (filterError: any) {
      console.error('[Meilisearch] Failed to update filterable attributes:', filterError.message);
    }
    
    console.log('[Meilisearch] Initialization complete - Search is ready!');
  } catch (error: any) {
    console.error('[Meilisearch] Initialization error:', error.message);
    console.warn('[Meilisearch] Search functionality may not work. Check if Meilisearch is running.');
  }
};
