import React, { useState, useEffect } from 'react';
import {
  ApolloClient, ApolloProvider, useQuery, gql, InMemoryCache, useSubscription,
} from '@apollo/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Card,
  CardContent,
  Typography,
  CardHeader,
  IconButton,
  FormControl,
  Box,
  Chip,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Grid,
} from '@material-ui/core';
import { DeleteOutlined } from '@material-ui/icons';
import wsLink from '../../apollo-socket';

const client = new ApolloClient({
  link: wsLink,
  cache: new InMemoryCache(),
});

const metricsQuery = gql`
  query {
    getMetrics
  }
`;

const measurementsQuery = gql`
 query ($input: [MeasurementQuery]) {
    getMultipleMeasurements(input: $input) {
      measurements {
        metric
        at
        value
        unit
      }
    }
  }
`;

const measurementSubscription = gql`
    subscription {
        newMeasurement {
            metric
            at
            value
            unit
        }
    }
`;

type MetricsResponse = {
  getMetrics: Array<string>;
};
type MultipleMeasurementsData = {
  measurements: [Measurement];
};
type Measurement = {
  metric: string;
  at: number;
  value: number;
  unit: string;
};
type MultipleMeasurementsResponse = {
  getMultipleMeasurements: MultipleMeasurementsData[];
};
type SubscriptionResponse = {
  newMeasurement: Measurement;
};
type GraphData = {
  at: number;
  unit: string;
  [key: string]: number | string;
};

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Array<string>>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<Array<string>>([]);
  const [measurements, setMeasurements] = useState<GraphData[]>([]);
  const [subscription, setSubscription] = useState<{ [key: string]: number | undefined }>({});
  const { data: metricsData } = useQuery<MetricsResponse>(metricsQuery);
  const { data: measurementsData } = useQuery<MultipleMeasurementsResponse>(measurementsQuery, {
    variables: {
      input: selectedMetrics.map((metric) => ({ metricName: metric })),
    },
  });
  const { data: subscriptionData } = useSubscription<SubscriptionResponse>(measurementSubscription);

  useEffect(() => {
    setMetrics(metricsData?.getMetrics || []);
  }, [metricsData]);

  useEffect(() => {
    const data: GraphData[] = [];
    measurementsData?.getMultipleMeasurements.forEach(x => x.measurements.forEach(y => {
      const dataGraph = {
        [y.metric]: y.value,
        at: y.at,
        unit: y.unit,
      };
      data.push(dataGraph);
    }));
    setMeasurements(data || []);
  }, [measurementsData]);

  useEffect(() => {
    if (subscriptionData?.newMeasurement) {
      setSubscription({ ...subscription, [`${subscriptionData?.newMeasurement.metric}`]: subscriptionData?.newMeasurement.value });
    }
  }, [subscriptionData]);

  const handleChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    setSelectedMetrics(e.target.value as Array<string>);
  };

  const onDelete = (metric: string) => {
    setSelectedMetrics(selectedMetrics.filter((m) => m !== metric));
  };

  return (
    <div>
      <Box sx={{ flexGrow: 1 }} m={2}>
        <Grid container spacing={4}>
          <Grid item xs={4}>
            <FormControl style={{ width: '40%' }}>
              <InputLabel id="demo-multiple-chip-label">Select Metric</InputLabel>
              <Select
                labelId="demo-multiple-chip-label"
                id="demo-multiple-chip"
                multiple
                value={selectedMetrics}
                onChange={handleChange}
                input={<OutlinedInput id="select-multiple-chip" label="Chip" />}
                renderValue={(selected: unknown) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                    {(selected as Array<string>).map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {metrics.map((metric) => (
                  <MenuItem key={metric} value={metric}>
                    {metric}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={8}>
            {selectedMetrics.map((metric) => (
              <Card elevation={3}>
                <CardHeader
                  action={(
                    <IconButton onClick={() => onDelete(metric)}>
                      <DeleteOutlined />
                    </IconButton>
            )}
                  title={metric}
                />
                <CardContent>
                  <Typography variant="h5" component="h2">
                    {subscription[metric]}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={1}>
          {measurements.length
          && (
          <LineChart
            width={1152}
            height={535}
            data={measurements}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" />
            <Tooltip />
            <Line yAxisId="left" type="monotone" dataKey="oilTemp" stroke="#8884d8" />
            <Line yAxisId="right" type="monotone" dataKey="waterTemp" stroke="#82ca9d" />
          </LineChart>
          )}
        </Grid>
      </Box>
    </div>
  );
};

export default () => (
  <ApolloProvider client={client}>
    <Dashboard />
  </ApolloProvider>
);
