import { check, sleep } from 'k6';
import { GraphQLHelper } from '../../../shared/helpers/GraphQLHelper';

// Using a public GraphQL API for testing (SpaceX API)
const graphql = new GraphQLHelper('https://spacex-production.up.railway.app');

export const options = {
  vus: 1,
  duration: '30s'
};

export default function () {
  // Query: Get company information
  const companyQuery = `
    query GetCompanyInfo {
      company {
        name
        founder
        founded
        employees
        ceo
        cto
        coo
        summary
      }
    }
  `;

  const companyRes = graphql.query(companyQuery);
  const companyData = GraphQLHelper.parseResponse(companyRes);

  check(companyData, {
    'company query has no errors': (data) => !GraphQLHelper.hasErrors(data),
    'company data exists': (data) => !!data.data,
    'company has name': (data) => !!data.data?.company?.name
  });

  if (GraphQLHelper.hasErrors(companyData)) {
    console.error('GraphQL Errors:', GraphQLHelper.getErrorMessages(companyData));
  }

  sleep(1);

  // Query with variables: Get specific rocket
  const rocketQuery = `
    query GetRocket($id: ID!) {
      rocket(id: $id) {
        id
        name
        type
        active
        stages
        boosters
        cost_per_launch
        success_rate_pct
        first_flight
        country
        company
        description
      }
    }
  `;

  const rocketRes = graphql.query(rocketQuery, { id: 'falcon9' });
  const rocketData = GraphQLHelper.parseResponse(rocketRes);

  check(rocketData, {
    'rocket query has no errors': (data) => !GraphQLHelper.hasErrors(data),
    'rocket data exists': (data) => !!data.data,
    'rocket is Falcon 9': (data) => data.data?.rocket?.name === 'Falcon 9'
  });

  sleep(1);

  // Query: Get launches with pagination
  const launchesQuery = `
    query GetLaunches($limit: Int!) {
      launches(limit: $limit) {
        id
        mission_name
        launch_date_utc
        launch_success
        rocket {
          rocket_name
        }
      }
    }
  `;

  const launchesRes = graphql.query(launchesQuery, { limit: 5 });
  const launchesData = GraphQLHelper.parseResponse(launchesRes);

  check(launchesData, {
    'launches query has no errors': (data) => !GraphQLHelper.hasErrors(data),
    'launches data exists': (data) => !!data.data,
    'launches array has items': (data) => Array.isArray(data.data?.launches) && data.data.launches.length > 0
  });

  // Log sample data
  if (launchesData.data?.launches) {
    console.log(`Retrieved ${launchesData.data.launches.length} launches`);
  }
}
