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
  AccountBalanceWallet,
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
    { text: 'Transactions', icon: <Receipt />, path: '/app/transactions' },
    { text: 'Bills', icon: <Description />, path: '/app/bills' },
    { text: 'Budgets', icon: <AccountBalance />, path: '/app/budget' },
    { text: 'Spending', icon: <Assessment />, path: '/app/spending' },
  ];

  const currentPage = menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard';

  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = React.useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const drawer = (
    <Box
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      sx={{
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, #0d7377 0%, #14959c 100%)'
          : 'linear-gradient(180deg, #14959c 0%, #1fb5bc 100%)',
        borderRight: 'none',
        display: 'flex',
        flexDirection: 'column',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isHovering
            ? `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.15) 0%, transparent 50%)`
            : 'none',
          pointerEvents: 'none',
          transition: 'opacity 0.3s ease',
          opacity: isHovering ? 1 : 0,
        },
      }}
    >
      <Box sx={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: desktopOpen ? 'space-between' : 'center',
        px: 2,
        background: 'none',
      }}>
        {!desktopOpen && (
          <IconButton
            onClick={handleDesktopDrawerToggle}
            sx={{
              color: '#ffffff',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <AccountBalanceWallet
              sx={{
                fontSize: '2.5rem',
                filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))',
              }}
            />
          </IconButton>
        )}
        {desktopOpen && (
          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
              '&:hover': {
                opacity: 0.8,
              },
            }}
          >
            <AccountBalanceWallet
              sx={{
                fontSize: '2rem',
                color: '#ffffff',
                filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))',
              }}
            />
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
          </Box>
        )}
        {desktopOpen && (
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
        )}
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
              my: 0.5,
              borderRadius: 2,
              justifyContent: desktopOpen ? 'flex-start' : 'center',
              transition: 'all 0.2s ease-in-out',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.25) 100%)',
                opacity: 0,
                transition: 'opacity 0.2s ease-in-out',
                borderRadius: 2,
              },
              '&:hover::before': {
                opacity: 1,
              },
              '&:hover': {
                transform: 'translateX(4px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              },
              '&.active': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              },
              '& .MuiListItemIcon-root': {
                color: '#ffffff',
                minWidth: desktopOpen ? 40 : 0,
                zIndex: 1,
              },
              '& .MuiListItemText-primary': {
                color: '#ffffff',
                zIndex: 1,
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
          to="/app/settings"
          sx={{
            color: '#ffffff',
            textDecoration: 'none',
            mx: 1,
            my: 0.5,
            borderRadius: 2,
            justifyContent: desktopOpen ? 'flex-start' : 'center',
            transition: 'all 0.2s ease-in-out',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.25) 100%)',
              opacity: 0,
              transition: 'opacity 0.2s ease-in-out',
              borderRadius: 2,
            },
            '&:hover::before': {
              opacity: 1,
            },
            '&:hover': {
              transform: 'translateX(4px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            '& .MuiListItemIcon-root': {
              color: '#ffffff',
              minWidth: desktopOpen ? 40 : 0,
              zIndex: 1,
            },
            '& .MuiListItemText-primary': {
              color: '#ffffff',
              zIndex: 1,
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
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(18, 18, 18, 0.95) 0%, rgba(30, 30, 30, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(240, 245, 250, 0.95) 0%, rgba(255, 255, 255, 0.95) 100%)',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};