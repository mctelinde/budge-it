import React from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4,
  Brightness7,
  Receipt,
  AccountBalance,
  Assessment,
  Description,
  ChevronLeft,
  ChevronRight,
  Settings,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 240;
const COLLAPSED_DRAWER_WIDTH = 72;

interface LayoutProps {
  children: React.ReactNode;
  toggleTheme: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, toggleTheme }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [desktopOpen, setDesktopOpen] = React.useState(true);
  const theme = useTheme();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDesktopDrawerToggle = () => {
    setDesktopOpen(!desktopOpen);
  };

  const menuItems = [
    { text: 'Transactions', icon: <Receipt />, path: '/transactions' },
    { text: 'Bills', icon: <Description />, path: '/bills' },
    { text: 'Budget', icon: <AccountBalance />, path: '/budget' },
    { text: 'Categories', icon: <Assessment />, path: '/categories' },
  ];

  const currentPage = menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard';

  const drawer = (
    <Box sx={{
      height: '100vh',
      overflow: 'hidden',
      background: theme.palette.mode === 'dark'
        ? 'linear-gradient(180deg, #0d7377 0%, #14959c 100%)'
        : 'linear-gradient(180deg, #14959c 0%, #1fb5bc 100%)',
      borderRight: 'none',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Box sx={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        background: 'none',
      }}>
        {desktopOpen && (
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"Righteous", "Inter", sans-serif',
              fontSize: '1.85rem',
              fontWeight: 400,
              letterSpacing: '0.5px',
              color: '#ffffff',
              textShadow: '2px 2px 6px rgba(0, 0, 0, 0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            budge-it
          </Typography>
        )}
        <IconButton
          onClick={handleDesktopDrawerToggle}
          sx={{
            color: '#ffffff',
            display: { xs: 'none', sm: 'flex' },
            ml: desktopOpen ? 0 : 'auto',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          {desktopOpen ? <ChevronLeft /> : <ChevronRight />}
        </IconButton>
      </Box>
      <List sx={{
        overflow: 'auto',
        flexGrow: 1,
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        scrollbarWidth: 'none'
      }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            component={Link}
            to={item.path}
            sx={{
              color: '#ffffff',
              textDecoration: 'none',
              mx: 1,
              borderRadius: 1,
              justifyContent: desktopOpen ? 'flex-start' : 'center',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
              },
              '&.active': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
              '& .MuiListItemIcon-root': {
                color: '#ffffff',
                minWidth: desktopOpen ? 40 : 0,
              },
              '& .MuiListItemText-primary': {
                color: '#ffffff',
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            {desktopOpen && <ListItemText primary={item.text} />}
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 'auto', p: 1 }}>
        <ListItem
          component={Link}
          to="/settings"
          sx={{
            color: '#ffffff',
            textDecoration: 'none',
            mx: 1,
            borderRadius: 1,
            justifyContent: desktopOpen ? 'flex-start' : 'center',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
            },
            '& .MuiListItemIcon-root': {
              color: '#ffffff',
              minWidth: desktopOpen ? 40 : 0,
            },
            '& .MuiListItemText-primary': {
              color: '#ffffff',
            },
          }}
        >
          <ListItemIcon>
            <Settings />
          </ListItemIcon>
          {desktopOpen && <ListItemText primary="Settings" />}
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: {
            xs: '100%',
            sm: `calc(100% - ${desktopOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH}px)`
          },
          ml: {
            xs: 0,
            sm: `${desktopOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH}px`
          },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          background: theme.palette.mode === 'dark'
            ? 'rgba(0, 0, 0, 0.2)'
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.05)'}`,
        }}
      >
        <Toolbar sx={{
          height: 64,
          minHeight: 64,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              display: { sm: 'none' },
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            {currentPage}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            onClick={toggleTheme}
            size="small"
            sx={{
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'rgba(0, 0, 0, 0.1)',
              },
              width: 34,
              height: 34,
              borderRadius: '8px',
            }}
          >
            {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: {
            xs: 0,
            sm: desktopOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH
          },
          flexShrink: { sm: 0 },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              border: 'none',
              background: 'none',
              overflow: 'hidden',
            },
          }}
        >
          {drawer}
        </Drawer>
          <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: desktopOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
              border: 'none',
              background: 'none',
              overflow: 'hidden',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: 3,
          pt: 8,
          pb: 2,
          width: {
            xs: '100%',
            sm: `calc(100% - ${desktopOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH}px)`
          },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(0, 0, 0, 0.2)'
            : 'rgba(255, 255, 255, 0.8)',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};