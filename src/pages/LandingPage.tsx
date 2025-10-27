import React from 'react';
import { Box, Typography, Button, Container, Grid, Card, CardContent, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  AccountBalanceWallet,
  Receipt,
  TrendingUp,
  Description,
  Assessment,
  Security,
} from '@mui/icons-material';

export const LandingPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Receipt sx={{ fontSize: '3rem' }} />,
      title: 'Track Transactions',
      description: 'Easily manage income and expenses with smart categorization and real-time search',
    },
    {
      icon: <Description sx={{ fontSize: '3rem' }} />,
      title: 'Manage Bills',
      description: 'Never miss a payment with bill tracking and recurring payment management',
    },
    {
      icon: <AccountBalanceWallet sx={{ fontSize: '3rem' }} />,
      title: 'Budget Planning',
      description: 'Set budgets, track progress, and achieve your financial goals',
    },
    {
      icon: <Assessment sx={{ fontSize: '3rem' }} />,
      title: 'Spending Analytics',
      description: 'Visualize your spending patterns with insightful charts and reports',
    },
    {
      icon: <TrendingUp sx={{ fontSize: '3rem' }} />,
      title: 'Financial Insights',
      description: 'Get personalized recommendations to improve your financial health',
    },
    {
      icon: <Security sx={{ fontSize: '3rem' }} />,
      title: 'Secure & Private',
      description: 'Your financial data is encrypted and stored securely',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(13, 115, 119, 0.95) 0%, rgba(20, 149, 156, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(20, 149, 156, 0.95) 0%, rgba(31, 181, 188, 0.95) 100%)',
      }}
    >
      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box
          sx={{
            pt: { xs: 8, md: 12 },
            pb: { xs: 8, md: 10 },
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <AccountBalanceWallet
              sx={{
                fontSize: '4rem',
                color: '#ffffff',
                mr: 2,
                filter: 'drop-shadow(2px 2px 8px rgba(0, 0, 0, 0.3))',
              }}
            />
            <Typography
              variant="h1"
              sx={{
                fontFamily: '"Righteous", "Manrope", sans-serif',
                fontSize: { xs: '3rem', md: '4.5rem' },
                fontWeight: 400,
                color: '#ffffff',
                textShadow: '3px 3px 10px rgba(0, 0, 0, 0.3)',
              }}
            >
              budge-it
            </Typography>
          </Box>

          <Typography
            variant="h4"
            sx={{
              mb: 3,
              color: '#ffffff',
              fontWeight: 300,
              fontSize: { xs: '1.5rem', md: '2rem' },
              textShadow: '2px 2px 6px rgba(0, 0, 0, 0.2)',
            }}
          >
            Your Personal Finance, Simplified
          </Typography>

          <Typography
            variant="h6"
            sx={{
              mb: 5,
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 400,
              maxWidth: '600px',
              mx: 'auto',
              textShadow: '1px 1px 4px rgba(0, 0, 0, 0.2)',
            }}
          >
            Take control of your finances with intuitive tracking, smart budgeting, and insightful analytics
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/app/transactions')}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                background: '#ffffff',
                color: theme.palette.mode === 'dark' ? '#0d7377' : '#14959c',
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.9)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/app/transactions')}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                borderColor: '#ffffff',
                color: '#ffffff',
                borderWidth: 2,
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              View Demo
            </Button>
          </Box>
        </Box>

        {/* Features Section */}
        <Box sx={{ pb: 10 }}>
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              mb: 6,
              color: '#ffffff',
              fontWeight: 600,
              textShadow: '2px 2px 6px rgba(0, 0, 0, 0.2)',
            }}
          >
            Everything You Need
          </Typography>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.3)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Box
                      sx={{
                        color: theme.palette.mode === 'dark' ? '#ffffff' : '#14959c',
                        mb: 2,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: theme.palette.mode === 'dark' ? '#ffffff' : '#0d7377',
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.8)'
                          : 'rgba(0, 0, 0, 0.7)',
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Call to Action */}
        <Box
          sx={{
            textAlign: 'center',
            pb: 8,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              mb: 3,
              color: '#ffffff',
              fontWeight: 600,
              textShadow: '2px 2px 6px rgba(0, 0, 0, 0.2)',
            }}
          >
            Ready to Take Control?
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/app/transactions')}
            sx={{
              px: 5,
              py: 2,
              fontSize: '1.2rem',
              background: '#ffffff',
              color: theme.palette.mode === 'dark' ? '#0d7377' : '#14959c',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.9)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Start Managing Your Finances
          </Button>
        </Box>
      </Container>
    </Box>
  );
};
