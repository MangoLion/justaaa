import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

// Helper component to handle different submission data types
const SubmissionDataDisplay = ({ data }) => {
  // Deep clone the data to avoid modifying the original
  const displayData = JSON.parse(JSON.stringify(data));
  const url = displayData?.url;
  
  // Keep url field but set its value to empty string
  if (displayData?.url) {
    displayData.url = '(ommitted, shown below)';
  }

  return (
    <div className="space-y-4">
      <pre className="mt-2 p-2 bg-muted rounded-md overflow-x-auto">
        {JSON.stringify(displayData, null, 2)}
      </pre>
      
      {url && url.startsWith('data:image/') && (
        <div className="mt-4">
          <img 
            src={url} 
            alt="Submission result" 
            className="max-w-full h-auto rounded-md"
          />
        </div>
      )}
    </div>
  );
};

const RequestDialog = ({ isOpen, onClose, pb, user, onRequestSubmit, onSaveToGallery }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchRequests = async () => {
    try {
      const records = await pb.collection('requests').getFullList({
        expand: 'requester,submitter',
        sort: '-created',
      });
      setRequests(records);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  const handleSubmitRequest = async (request) => {
    try {
      // Get submitter's userdata first
      const userDataRecords = await pb.collection('userdata').getList(1, 1, {
        filter: `user = "${user.id}"`,
      });
      
      const userData = userDataRecords.items[0];
      const currentBalance = userData?.balance || 0;
      const newBalance = currentBalance + request.quote;

      // Update submitter's balance
      if (userData) {
        await pb.collection('userdata').update(userData.id, {
          balance: newBalance,
        });
      } else {
        await pb.collection('userdata').create({
          user: user.id,
          balance: newBalance,
          bucketurl: `https://storage.deepinfra.com/${user.id}`,
        });
      }

      // Trigger balance update in ProfileButton
      window.dispatchEvent(new CustomEvent('balanceUpdate'));

      // Call the parent component's submit handler
      onRequestSubmit(request);
      onClose();
    } catch (error) {
      console.error('Failed to handle request:', error);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      await pb.collection('requests').delete(requestId);
      fetchRequests();
    } catch (error) {
      console.error('Failed to delete request:', error);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'open': return 'default';
      case 'in-progress': return 'secondary';
      case 'completed': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  const getUserDisplay = (userId, expandedUser) => {
    if (expandedUser?.name) {
      return expandedUser.name;
    }
    return userId ? userId.substring(0, 5) : 'Unknown';
  };

  const RequestDetails = ({ request, onClose }) => (
    <div className="space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto pr-4">
      <div className="flex justify-between items-start">
        <div>
          <Badge variant={getStatusBadgeVariant(request.status)} className="mb-2">
            {request.status}
          </Badge>
          <div className="text-sm text-muted-foreground">
            Requested by: {getUserDisplay(request.requester, request.expand?.requester)}
          </div>
          {request.submitter && (
            <div className="text-sm text-muted-foreground">
              Submitted by: {request.submitter.substring(0, 5)}
            </div>
          )}
          <div className="text-sm font-medium mt-1">
              Quote: ${request.quote.toFixed(2)}
            </div>
        </div>
      </div>
      <div className="text-sm">
        <strong>Description:</strong>
        <p className="mt-1">{request.description || 'No description provided'}</p>
      </div>
      <div className="text-sm">
        <strong>Parameters:</strong>
        <pre className="mt-2 p-2 bg-muted rounded-md overflow-x-auto">
          {JSON.stringify(request.parameters, null, 2)}
        </pre>
      </div>
      {request.status === 'completed' && request.submission && (
        <div className="text-sm">
          <strong>Submission:</strong>
          <SubmissionDataDisplay data={request.submission} />
          <div className="mt-4">
            <Button 
              onClick={() => onSaveToGallery(request)} 
              variant="secondary"
              className="w-full"
            >
              Save to Gallery
            </Button>
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {request.status === 'open' && request.requester !== user?.id && (
          <Button onClick={() => handleSubmitRequest(request)} variant="secondary">
            Fulfill Request
          </Button>
        )}
        {request.status === 'open' && request.requester === user?.id && (
          <Button onClick={() => handleDeleteRequest(request.id)} variant="destructive">
            Delete
          </Button>
        )}
      </div>
    </div>
  );

  const RequestCard = ({ request }) => (
    <Card key={request.id} className="mb-4">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <Badge variant={getStatusBadgeVariant(request.status)} className="mb-2">
              {request.status}
            </Badge>
            <div className="text-base mb-1">
              {request.description || 'No description provided'}
            </div>
            <div className="text-sm text-muted-foreground">
              Requested by: {getUserDisplay(request.requester, request.expand?.requester)}
            </div>
            {request.submitter && (
              <div className="text-sm text-muted-foreground">
                Submitted by: {request.submitter.substring(0, 5)}
              </div>
            )}
            <div className="text-sm font-medium mt-1">
                Quote: ${request.quote.toFixed(2)}
              </div>
          </div>
          <div className="flex gap-2">
            {request.status === 'open' && request.requester !== user?.id && (
              <Button onClick={() => handleSubmitRequest(request)} variant="secondary" size="sm">
                Fulfill
              </Button>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Request Details</SheetTitle>
                  <SheetDescription>
                    {request.description || 'No description provided'}
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                  <RequestDetails request={request} onClose={() => {}} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Board</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="open">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="open">Open Requests</TabsTrigger>
            <TabsTrigger value="my">My Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="open">
            {loading ? (
              <div>Loading requests...</div>
            ) : (
              requests
                .filter(request => request.status === 'open')
                .map(request => (
                  <RequestCard key={request.id} request={request} />
                ))
            )}
          </TabsContent>

          <TabsContent value="my">
            {loading ? (
              <div>Loading requests...</div>
            ) : (
              requests
                .filter(request => request.requester === user?.id || request.submitter === user?.id)
                .map(request => (
                  <RequestCard key={request.id} request={request} />
                ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RequestDialog;
