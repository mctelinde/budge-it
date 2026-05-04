import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Wallet,
  Receipt,
  TrendingUp,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 72;

interface LayoutProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const menuItems = [
  { text: 'Budgets', icon: Wallet, path: '/app/budget' },
  { text: 'Forecasts', icon: TrendingUp, path: '/app/forecasts' },
  { text: 'Spending', icon: BarChart2, path: '/app/spending' },
  { text: 'Transactions', icon: Receipt, path: '/app/transactions' },
];

// Gradient colors matching the legacy app
const SIDEBAR_GRADIENT_LIGHT = 'linear-gradient(180deg, #14959c 0%, #1fb5bc 100%)';
const SIDEBAR_GRADIENT_DARK = 'linear-gradient(180deg, #0d7377 0%, #14959c 100%)';

interface SidebarContentProps {
  expanded: boolean;
  isDarkMode: boolean;
  onToggleExpanded?: () => void;
  onNavClick?: () => void;
}

interface NavItemProps {
  icon: React.ElementType;
  text: string;
  path: string;
  expanded: boolean;
  isActive: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, text, path, expanded, isActive, onClick }) => {
  const item = (
    <Link
      to={path}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 mx-2 my-0.5 px-3 py-2.5 rounded-lg',
        'text-white no-underline transition-all duration-200 ease-in-out',
        'relative overflow-hidden group',
        expanded ? 'justify-start' : 'justify-center',
        isActive
          ? 'bg-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.1)]'
          : 'hover:translate-x-1 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]',
      )}
    >
      {/* Hover shimmer overlay */}
      <span
        className={cn(
          'absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200',
          'bg-gradient-to-br from-white/15 to-white/25',
          !isActive && 'group-hover:opacity-100',
        )}
      />
      <Icon className="size-5 shrink-0 z-10" />
      {expanded && <span className="text-sm font-medium z-10">{text}</span>}
    </Link>
  );

  if (!expanded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{item}</TooltipTrigger>
        <TooltipContent side="right">{text}</TooltipContent>
      </Tooltip>
    );
  }
  return item;
};

const SidebarContent: React.FC<SidebarContentProps> = ({
  expanded,
  isDarkMode,
  onToggleExpanded,
  onNavClick,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };


  return (
    <div
      className="flex flex-col h-full overflow-hidden relative"
      style={{
        background: isDarkMode ? SIDEBAR_GRADIENT_DARK : SIDEBAR_GRADIENT_LIGHT,
      }}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center h-16 px-3 shrink-0',
          expanded ? 'justify-between' : 'justify-center',
        )}
      >
        {expanded ? (
          <>
            <Link
              to="/app/budget"
              className="flex items-center gap-2.5 no-underline hover:opacity-80 transition-opacity"
            >
              <Wallet
                className="text-white drop-shadow-md"
                style={{ width: '2rem', height: '2rem' }}
              />
              <span
                className="text-white text-[1.75rem] font-normal tracking-wide whitespace-nowrap"
                style={{
                  fontFamily: '"Righteous", "Inter", sans-serif',
                  textShadow: '2px 2px 6px rgba(0,0,0,0.3)',
                }}
              >
                budge-it
              </span>
            </Link>
            {onToggleExpanded && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleExpanded}
                className="text-white hover:bg-white/10 hidden sm:flex shrink-0"
              >
                <ChevronLeft className="size-5" />
              </Button>
            )}
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleExpanded}
            className="text-white hover:bg-white/10"
          >
            <ChevronRight className="size-5" />
          </Button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-1">
        {menuItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            text={item.text}
            path={item.path}
            expanded={expanded}
            isActive={location.pathname === item.path}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* Bottom items */}
      <div className="mt-auto pb-2">
        <NavItem icon={Settings} text="Settings" path="/app/settings"
          expanded={expanded} isActive={location.pathname === '/app/settings'} onClick={onNavClick} />

        {/* Logout */}
        {(() => {
          const btn = (
            <button
              onClick={handleSignOut}
              className={cn(
                'flex items-center gap-3 w-[calc(100%-16px)] mx-2 my-0.5 px-3 py-2.5 rounded-xl',
                'text-white transition-all duration-200 cursor-pointer',
                'hover:bg-white/15 group',
                expanded ? 'justify-start' : 'justify-center',
              )}
            >
              <LogOut className="size-5 shrink-0" />
              {expanded && <span className="text-sm font-medium">Logout</span>}
            </button>
          );
          if (!expanded) {
            return (
              <Tooltip>
                <TooltipTrigger asChild>{btn}</TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            );
          }
          return btn;
        })()}
      </div>
    </div>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children, isDarkMode, toggleTheme }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [desktopExpanded, setDesktopExpanded] = React.useState(() => {
    const saved = localStorage.getItem('sidebarExpanded');
    return saved === null ? true : saved === 'true';
  });
  const location = useLocation();

  const currentPage =
    menuItems.find((item) => item.path === location.pathname)?.text ?? 'Settings';

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop permanent sidebar */}
      <aside
        className="hidden sm:flex flex-col shrink-0 transition-all duration-200 ease-in-out"
        style={{ width: desktopExpanded ? DRAWER_WIDTH : COLLAPSED_WIDTH }}
      >
        <div className="fixed top-0 bottom-0 overflow-hidden transition-all duration-200 ease-in-out"
          style={{ width: desktopExpanded ? DRAWER_WIDTH : COLLAPSED_WIDTH }}
        >
          <SidebarContent
            expanded={desktopExpanded}
            isDarkMode={isDarkMode}
            onToggleExpanded={() => setDesktopExpanded((v) => { localStorage.setItem('sidebarExpanded', String(!v)); return !v; })}
          />
        </div>
      </aside>

      {/* Mobile sheet drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          {/* Trigger is the hamburger in the top bar — rendered below */}
          <span />
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[240px] border-none [&_[data-slot=sheet-close]]:text-white [&_[data-slot=sheet-close]]:hover:bg-white/20">
          <SidebarContent
            expanded={true}
            isDarkMode={isDarkMode}
            onNavClick={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex items-center h-16 px-6 gap-4 border-b border-border/50 backdrop-blur-sm bg-background/80 shrink-0">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>

          <h1
            className="text-xl font-medium tracking-wide"
            style={{ fontFamily: '"Righteous", "Inter", sans-serif' }}
          >
            {currentPage}
          </h1>

          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="size-[34px] rounded-lg"
            >
              {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
};
