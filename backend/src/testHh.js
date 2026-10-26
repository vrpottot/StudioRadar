import { scrapeAllHhLeads } from './hhScraper.js';

async function main() {
  console.log('--- Testing scrapeAllHhLeads ---');
  const leads = await scrapeAllHhLeads(6);
  console.log('Found leads:', leads.length);
  for (const l of leads) {
    console.log(`- Company: ${l.company}`);
    console.log(`  Title: ${l.title}`);
    console.log(`  Industry: ${l.industry}`);
    console.log(`  Budget: ${l.budget}`);
    console.log(`  Phone: ${l.phone}`);
    console.log(`  URL: ${l.url}`);
    console.log('-----------------------------');
  }
}

main().catch(console.error);
