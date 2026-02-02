import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../hooks/use-toast';
import { 
  Loader2, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  StickyNote,
  Clock,
  Building2,
  Mail,
  Phone,
  Calendar,
  User,
  ArrowUpDown,
  FileText,
  UserX
} from 'lucide-react';
import { sellerRequestService } from '../../services/firebase/sellerRequestService';
import { userService } from '../../services/firebase/userService';

const AdminSellerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [feedback, setFeedback] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    businessName: '',
    businessDescription: '',
    businessCategory: '',
    businessAddress: '',
    businessPhone: '',
    businessEmail: ''
  });

  useEffect(() => {
    // Set up real-time listener for seller requests
    const unsubscribe = sellerRequestService.listenToSellerRequests((data) => {
      setRequests(data);
      setLoading(false);
    });

    // Load users for reference
    loadUsers();

    return () => unsubscribe();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await userService.getAllUsers();
      const usersMap = {};
      allUsers.forEach(user => {
        usersMap[user.id] = user;
      });
      setUsers(usersMap);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Filter and sort requests
  const filteredRequests = useMemo(() => {
    let filtered = [...requests];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(req => {
        const user = users[req.userId] || {};
        return (
          req.businessName?.toLowerCase().includes(term) ||
          req.businessDescription?.toLowerCase().includes(term) ||
          user.name?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term)
        );
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.requestDate) - new Date(a.requestDate);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'business':
          comparison = (a.businessName || '').localeCompare(b.businessName || '');
          break;
        default:
          comparison = new Date(b.requestDate) - new Date(a.requestDate);
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return filtered;
  }, [requests, statusFilter, searchTerm, sortBy, sortOrder, users]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { variant: 'success', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { variant: 'destructive', color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleEditRequest = (request) => {
    setSelectedRequest(request);
    setEditFormData({
      businessName: request.businessName || '',
      businessDescription: request.businessDescription || '',
      businessCategory: request.businessCategory || '',
      businessAddress: request.businessAddress || '',
      businessPhone: request.businessPhone || '',
      businessEmail: request.businessEmail || ''
    });
    setEditDialogOpen(true);
  };

  const handleOpenAction = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setFeedback('');
    setActionDialogOpen(true);
  };

  const handleOpenNotes = (request) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || '');
    setNotesDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    try {
      await sellerRequestService.updateSellerRequest(selectedRequest.id, editFormData);
      toast({ title: 'Request updated successfully' });
      setEditDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessAction = async () => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    try {
      if (actionType === 'approve') {
        await sellerRequestService.approveSellerRequest(
          selectedRequest.id, 
          selectedRequest.userId,
          feedback
        );
        toast({ 
          title: 'Request Approved',
          description: 'The seller account has been activated.'
        });
      } else {
        await sellerRequestService.rejectSellerRequest(selectedRequest.id, feedback);
        toast({ 
          title: 'Request Rejected',
          description: 'The seller request has been declined.'
        });
      }
      setActionDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    try {
      await sellerRequestService.updateAdminNotes(selectedRequest.id, adminNotes);
      toast({ title: 'Admin notes saved' });
      setNotesDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Stats calculation
  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  }), [requests]);

  return (
    <div className="p-8" data-testid="admin-seller-requests">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Seller Requests</h1>
        <p className="text-gray-600">Manage and review seller account applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Requests</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by business name, user name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-white"
                data-testid="status-filter"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-white"
                data-testid="sort-by"
              >
                <option value="date">Sort by Date</option>
                <option value="status">Sort by Status</option>
                <option value="business">Sort by Business</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortOrder}
                data-testid="sort-order-btn"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Requests List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card className="p-12 text-center">
          <UserX className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Seller Requests</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'No requests match your filters. Try adjusting your search criteria.'
              : 'No seller account requests have been submitted yet.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const user = users[request.userId] || {};
            return (
              <Card key={request.id} className="p-6" data-testid={`seller-request-${request.id}`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="h-5 w-5 text-orange-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.businessName || 'Unnamed Business'}
                      </h3>
                      {getStatusBadge(request.status)}
                      {request.adminNotes && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <StickyNote className="h-3 w-3" />
                          Has Notes
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{user.name || 'Unknown User'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{user.email || request.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Submitted: {formatDate(request.requestDate)}</span>
                      </div>
                      {request.businessCategory && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>Category: {request.businessCategory}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(request)}
                      data-testid={`view-btn-${request.id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditRequest(request)}
                      data-testid={`edit-btn-${request.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenNotes(request)}
                      data-testid={`notes-btn-${request.id}`}
                    >
                      <StickyNote className="h-4 w-4 mr-1" />
                      Notes
                    </Button>
                    {request.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleOpenAction(request, 'approve')}
                          data-testid={`approve-btn-${request.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleOpenAction(request, 'reject')}
                          data-testid={`reject-btn-${request.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-600" />
              Seller Request Details
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{selectedRequest.businessName || 'Unnamed Business'}</h3>
                {getStatusBadge(selectedRequest.status)}
              </div>

              {/* User Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Requester Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <p className="font-medium">{users[selectedRequest.userId]?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium">{users[selectedRequest.userId]?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Registration Date:</span>
                    <p className="font-medium">{formatDate(users[selectedRequest.userId]?.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Request Date:</span>
                    <p className="font-medium">{formatDate(selectedRequest.requestDate)}</p>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Business Details
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Business Name:</span>
                    <p className="font-medium">{selectedRequest.businessName || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <p className="font-medium">{selectedRequest.businessCategory || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Description:</span>
                    <p className="font-medium">{selectedRequest.businessDescription || 'No description provided'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-500">Address:</span>
                      <p className="font-medium">{selectedRequest.businessAddress || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <p className="font-medium">{selectedRequest.businessPhone || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Business Email:</span>
                    <p className="font-medium">{selectedRequest.businessEmail || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Status Information */}
              {(selectedRequest.status === 'approved' || selectedRequest.status === 'rejected') && (
                <div className={`rounded-lg p-4 ${selectedRequest.status === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {selectedRequest.status === 'approved' ? 'Approval Details' : 'Rejection Details'}
                  </h4>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <p className="font-medium">
                        {formatDate(selectedRequest.approvedDate || selectedRequest.rejectedDate)}
                      </p>
                    </div>
                    {selectedRequest.adminFeedback && (
                      <div>
                        <span className="text-gray-500">Feedback:</span>
                        <p className="font-medium">{selectedRequest.adminFeedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedRequest.adminNotes && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <StickyNote className="h-4 w-4" />
                    Admin Notes (Internal)
                  </h4>
                  <p className="text-sm text-gray-700">{selectedRequest.adminNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Seller Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={editFormData.businessName}
                onChange={(e) => setEditFormData({ ...editFormData, businessName: e.target.value })}
                data-testid="edit-business-name"
              />
            </div>
            <div>
              <Label htmlFor="businessCategory">Business Category</Label>
              <Input
                id="businessCategory"
                value={editFormData.businessCategory}
                onChange={(e) => setEditFormData({ ...editFormData, businessCategory: e.target.value })}
                data-testid="edit-business-category"
              />
            </div>
            <div>
              <Label htmlFor="businessDescription">Description</Label>
              <Textarea
                id="businessDescription"
                value={editFormData.businessDescription}
                onChange={(e) => setEditFormData({ ...editFormData, businessDescription: e.target.value })}
                rows={3}
                data-testid="edit-business-description"
              />
            </div>
            <div>
              <Label htmlFor="businessAddress">Address</Label>
              <Input
                id="businessAddress"
                value={editFormData.businessAddress}
                onChange={(e) => setEditFormData({ ...editFormData, businessAddress: e.target.value })}
                data-testid="edit-business-address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessPhone">Phone</Label>
                <Input
                  id="businessPhone"
                  value={editFormData.businessPhone}
                  onChange={(e) => setEditFormData({ ...editFormData, businessPhone: e.target.value })}
                  data-testid="edit-business-phone"
                />
              </div>
              <div>
                <Label htmlFor="businessEmail">Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={editFormData.businessEmail}
                  onChange={(e) => setEditFormData({ ...editFormData, businessEmail: e.target.value })}
                  data-testid="edit-business-email"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                onClick={handleSaveEdit}
                disabled={processing}
                data-testid="save-edit-btn"
              >
                {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Approve Seller Request
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Reject Seller Request
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p className="font-medium">{selectedRequest?.businessName}</p>
              <p className="text-gray-500">{users[selectedRequest?.userId]?.email}</p>
            </div>
            <div>
              <Label htmlFor="feedback">
                {actionType === 'approve' ? 'Approval Message (Optional)' : 'Rejection Reason'}
              </Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={actionType === 'approve' 
                  ? 'Congratulations! Your seller account has been approved...'
                  : 'Please provide a reason for rejection...'}
                rows={3}
                data-testid="action-feedback"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className={`flex-1 ${actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                onClick={handleProcessAction}
                disabled={processing}
                data-testid="confirm-action-btn"
              >
                {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </Button>
              <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-blue-600" />
              Admin Notes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              These notes are for internal tracking only and will not be visible to the requester.
            </p>
            <div>
              <Label htmlFor="adminNotes">Notes</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this request..."
                rows={4}
                data-testid="admin-notes-input"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleSaveNotes}
                disabled={processing}
                data-testid="save-notes-btn"
              >
                {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Notes
              </Button>
              <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSellerRequests;
