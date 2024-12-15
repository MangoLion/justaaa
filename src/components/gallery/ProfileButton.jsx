import React, { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { UserCircle, Coins } from 'lucide-react';
import { useToast } from "../../hooks/use-toast";
import UserAvatar from './UserAvatar';

const ProfileButton = ({ pb, user, onLogin, onLogout, onRequestsClick, onSyncGallery }) => {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(null);

  useEffect(() => {
    if (user) {
      loadUserBalance();
    } else {
      setCurrentBalance(null);
    }
  }, [user]);

  const loadUserBalance = async () => {
    try {
      const records = await pb.collection('userdata').getList(1, 1, {
        filter: `user = "${user.id}"`,
      });
      
      if (records.items.length > 0) {
        setCurrentBalance(records.items[0].balance || 0);
      } else {
        setCurrentBalance(0);
      }
    } catch (error) {
      console.error('Failed to load balance:', error);
      setCurrentBalance(0);
    }
  };

  const onBalanceUpdated = (newBalance) => {
    setCurrentBalance(newBalance);
  };

  return (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
      {user && currentBalance !== null && (
        <div className="flex items-center gap-1.5 bg-secondary/80 px-2.5 py-1 rounded-full">
          <Coins className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">{currentBalance}</span>
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          {user ? (
              <UserAvatar user={user} size="small" />
            ) : (
              <UserCircle className="h-5 w-5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {user ? (
            <>
              <DropdownMenuItem disabled>
                {user.email}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRequestsClick}>
                Requests
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSyncGallery}>
                Sync Gallery
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout}>
                Logout
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={() => setLoginDialogOpen(true)}>
              Login
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AuthDialog 
        open={loginDialogOpen} 
        onOpenChange={setLoginDialogOpen}
        pb={pb}
        onLogin={onLogin}
      />

      <ProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        pb={pb}
        user={user}
        onBalanceUpdated={onBalanceUpdated}
      />
    </div>
  );
};

const ProfileDialog = ({ open, onOpenChange, pb, user, onBalanceUpdated }) => {
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [addingBalance, setAddingBalance] = useState(false);
  const [newBalance, setNewBalance] = useState('');
  const { toast } = useToast();

  React.useEffect(() => {
    if (open && user) {
      loadUserData();
    }
  }, [open, user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // Try to get existing userdata
      const records = await pb.collection('userdata').getList(1, 1, {
        filter: `user = "${user.id}"`,
      });
      
      if (records.items.length > 0) {
        setUserData(records.items[0]);
        setBalance(records.items[0].balance || 0);
      } else {
        setBalance(0);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBalance = async () => {
    const amount = parseFloat(newBalance);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive number",
        variant: "destructive",
      });
      return;
    }

    try {
      const newTotal = (parseFloat(balance) || 0) + amount;
      
      if (userData) {
        // Update existing record
        await pb.collection('userdata').update(userData.id, {
          balance: newTotal,
        });
      } else {
        // Create new record
        await pb.collection('userdata').create({
          user: user.id,
          balance: newTotal,
          bucketurl: `https://storage.deepinfra.com/${user.id}`,
        });
      }

      setBalance(newTotal);
      setNewBalance('');
      setAddingBalance(false);
      onBalanceUpdated(newTotal);
      toast({
        title: "Success",
        description: "Balance updated successfully",
      });
      
      await loadUserData();
    } catch (error) {
      console.error('Failed to update balance:', error);
      toast({
        title: "Error",
        description: "Failed to update balance",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profile Information</DialogTitle>
          <DialogDescription>
            View and manage your profile details
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Name</Label>
              <div className="col-span-3">{user.name}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Email</Label>
              <div className="col-span-3">{user.email}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <div className="col-span-3">{user.status || 'normal'}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Balance</Label>
              <div className="col-span-3">
                {balance} credits
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={() => setAddingBalance(true)}
                >
                  Add Balance
                </Button>
              </div>
            </div>

            {addingBalance && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Add Amount</Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    type="number"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    min="0"
                    step="any"
                    placeholder="Enter amount"
                  />
                  <Button onClick={handleAddBalance}>Add</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const AuthDialog = ({ open, onOpenChange, pb, onLogin }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Authentication</DialogTitle>
          <DialogDescription>
            Login or create an account to save your settings and share your creations.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm pb={pb} onLogin={onLogin} onOpenChange={onOpenChange} />
          </TabsContent>
          <TabsContent value="signup">
            <SignUpForm pb={pb} onLogin={onLogin} onOpenChange={onOpenChange} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const LoginForm = ({ pb, onLogin, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      onLogin(authData.record);
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Successfully logged in!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Login failed:', error);
      setError('Invalid email or password');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your email and password to log in.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" onClick={handleSubmit}>Login</Button>
      </CardFooter>
    </Card>
  );
};

const SignUpForm = ({ pb, onLogin, onOpenChange }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setError("Password must be between 8 and 72 characters long");
      return;
    }

    try {
      const data = {
        username,
        email,
        emailVisibility: true,
        password,
        passwordConfirm,
        name
      };
      const record = await pb.collection('users').create(data);
      
      // Automatically log in the user after successful signup
      await pb.collection('users').authWithPassword(email, password);
      
      onLogin(record);
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Account created and logged in successfully!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Signup failed:', error);
      if (error.data) {
        const errorMessages = Object.values(error.data)
          .map(err => err.message)
          .join('. ');
        setError(`Signup failed: ${errorMessages}`);
      } else {
        setError(`Signup failed: ${error.message}`);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
        <CardDescription>Create a new account.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password (8-72 characters)</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="passwordConfirm">Confirm Password</Label>
              <Input 
                id="passwordConfirm" 
                type="password" 
                value={passwordConfirm} 
                onChange={(e) => setPasswordConfirm(e.target.value)} 
                required 
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" onClick={handleSubmit}>Sign Up</Button>
      </CardFooter>
    </Card>
  );
};

export default ProfileButton;
