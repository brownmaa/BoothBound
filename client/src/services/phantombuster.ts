/**
 * PhantomBuster API integration for lead enrichment
 * 
 * This service provides functions to enrich lead data using PhantomBuster's
 * LinkedIn scraper agent. It can help extract profile pictures, job titles,
 * company information, and other professional details from LinkedIn profiles.
 */

interface PhantomBusterData {
  avatar?: string;
  title?: string;
  company?: string;
  location?: string;
  industry?: string;
  connectionCount?: number;
  skills?: string[];
  bio?: string;
  linkedinUrl?: string;
  phoneNumber?: string;
}

interface PhantomBusterLaunchResponse {
  containerId: string;
  status: string;
}

interface PhantomBusterContainerOutput {
  status: string;
  output: any;
  data: {
    profileUrl?: string;
    imgUrl?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    occupation?: string;
    connectionDegree?: string;
    profileId?: string;
    mutualConnectionsUrl?: string;
    mutualConnectionsText?: string;
    location?: string;
    isPremium?: boolean;
    connectionCount?: number;
    headline?: string;
    summary?: string;
    company?: string;
    companyUrl?: string;
    jobTitle?: string;
    jobDescription?: string;
    jobDate?: string;
    skills?: string[];
    schoolName?: string;
    schoolUrl?: string;
    schoolDate?: string;
    schoolDegree?: string;
    phoneNumber?: string;
    email?: string;
    websites?: string[];
    twitter?: string;
  };
}

/**
 * Finds a LinkedIn profile by email address or name
 * @param searchQuery Email or name to search for
 * @returns URL to the LinkedIn profile or null if not found
 */
async function findLinkedInProfile(searchQuery: string): Promise<string | null> {
  const apiKey = process.env.PHANTOMBUSTER_API_KEY;
  const searchActorId = process.env.PHANTOMBUSTER_SEARCH_ACTOR_ID || process.env.PHANTOMBUSTER_ACTOR_ID;
  
  if (!apiKey || !searchActorId) {
    console.warn("PhantomBuster search credentials not found.");
    return null;
  }
  
  try {
    // This is where we would implement the actual LinkedIn search
    // For now, we'll assume we need to implement this later when API keys are provided
    console.log(`Would search for LinkedIn profile with query: ${searchQuery}`);
    return null;
  } catch (error) {
    console.error("Error finding LinkedIn profile:", error);
    return null;
  }
}

/**
 * Scrapes a LinkedIn profile using PhantomBuster
 * @param profileUrl URL of the LinkedIn profile to scrape
 * @returns Scraped data from the profile
 */
async function scrapeLinkedInProfile(profileUrl: string): Promise<PhantomBusterContainerOutput | null> {
  const apiKey = process.env.PHANTOMBUSTER_API_KEY;
  const scrapeActorId = process.env.PHANTOMBUSTER_ACTOR_ID;
  
  if (!apiKey || !scrapeActorId) {
    console.warn("PhantomBuster scraper credentials not found.");
    return null;
  }
  
  try {
    // Step 1: Launch the PhantomBuster agent to scrape the profile
    const launchResponse = await fetch(`https://api.phantombuster.com/api/v2/agents/launch`, {
      method: 'POST',
      headers: {
        'X-Phantombuster-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: scrapeActorId,
        argument: {
          sessionCookie: process.env.LINKEDIN_SESSION_COOKIE,
          spreadsheetUrl: profileUrl,
          numberOfProfiles: 1
        }
      })
    });
    
    if (!launchResponse.ok) {
      throw new Error(`Failed to launch PhantomBuster agent: ${launchResponse.statusText}`);
    }
    
    const launchData = await launchResponse.json() as PhantomBusterLaunchResponse;
    const containerId = launchData.containerId;
    
    // Step 2: Poll for completion
    let result: PhantomBusterContainerOutput | null = null;
    for (let i = 0; i < 12; i++) {
      // Wait 5 seconds between polls
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const statusResponse = await fetch(
        `https://api.phantombuster.com/api/v2/containers/fetch-output?id=${containerId}`,
        {
          headers: {
            'X-Phantombuster-Key': apiKey
          }
        }
      );
      
      if (statusResponse.ok) {
        const data = await statusResponse.json();
        if (data.status === "finished") {
          result = data;
          break;
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error scraping LinkedIn profile:", error);
    return null;
  }
}

/**
 * Enriches lead data using PhantomBuster's LinkedIn scraper
 * @param email The email address to look up
 * @returns Promise with enriched person data or null if not found
 */
export async function enrichLeadWithPhantomBuster(email: string): Promise<PhantomBusterData | null> {
  try {
    // Check for API keys - we'll add these later
    const apiKey = process.env.PHANTOMBUSTER_API_KEY;
    if (!apiKey) {
      console.warn("PhantomBuster API key not found. Add it later to enable LinkedIn integration.");
      
      // For development testing, just return a placeholder for now
      return {
        avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`,
        title: "Title will come from LinkedIn",
        company: "Company will come from LinkedIn",
        location: "Location will come from LinkedIn",
        industry: "Industry will come from LinkedIn",
        bio: "Bio will be extracted from LinkedIn profile"
      };
    }
    
    // Step 1: Find the LinkedIn profile URL using the email
    const profileUrl = await findLinkedInProfile(email);
    if (!profileUrl) {
      console.log(`No LinkedIn profile found for email: ${email}`);
      return null;
    }
    
    // Step 2: Scrape the LinkedIn profile data
    const profileData = await scrapeLinkedInProfile(profileUrl);
    if (!profileData || !profileData.data) {
      console.log(`Failed to scrape LinkedIn profile for: ${profileUrl}`);
      return null;
    }
    
    // Step 3: Extract and return the relevant data
    return {
      avatar: profileData.data.imgUrl,
      title: profileData.data.jobTitle || profileData.data.headline,
      company: profileData.data.company,
      location: profileData.data.location,
      industry: profileData.data.headline,
      connectionCount: profileData.data.connectionCount,
      skills: profileData.data.skills,
      bio: profileData.data.summary,
      linkedinUrl: profileData.data.profileUrl,
      phoneNumber: profileData.data.phoneNumber
    };
  } catch (error) {
    console.error("Error enriching lead with PhantomBuster:", error);
    return null;
  }
}
