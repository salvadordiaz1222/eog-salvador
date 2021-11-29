import React, { useState } from 'react';
import {
  ApolloClient,
  ApolloProvider,
  useQuery,
  gql,
  InMemoryCache,
} from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://react.eogresources.com/graphql',
  cache: new InMemoryCache(),
});

const metricsQuery = gql`
  query {
    getMetrics
  }
`;

type MetricsResponse = {
  getMetrics: Array<string>;
};

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Array<string>>([]);
  const { data: metricsData } = useQuery<MetricsResponse>(metricsQuery);

  React.useEffect(() => {
    setMetrics(metricsData?.getMetrics || []);
  }, [metricsData]);

  console.log(metrics);

  return null;
};

export default () => (
  <ApolloProvider client={client}>
    <Dashboard />
  </ApolloProvider>
);
