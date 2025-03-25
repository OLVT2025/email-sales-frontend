import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Mail,
  CheckCircle,
  AlertCircle,
  Upload,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import "./EmailDashboard.css";
import {
  CircularProgress,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Stack,
} from "@mui/material";

const EmailDashboard = () => {
  const [campaignId, setCampaignId] = useState(null);
  const [emailMetrics, setEmailMetrics] = useState({
    open_rate: 0,
    bounce_rate: 0,
    reply_rate: 0,
    unsubscribe_rate: 0,
    total_opens: 0,
    total_bounces: 0,
    total_replies: 0,
    total_unsubscribes: 0,
  });
  const [campaignStats, setCampaignStats] = useState({
    totalEmails: 0,
    successfulEmails: 0,
    failedEmails: 0,
    industries: {},
  });
  const [industryData, setIndustryData] = useState([]);
  const [emailRecords, setEmailRecords] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [allCampaignsLoading, setAllCampaignsLoading] = useState(false);
  const [showAllCampaigns, setShowAllCampaigns] = useState(false);
  const [resultsLoadingError, setResultsLoadingError] = useState(false);

  // New state for campaign details
  const [selectedCampaignDetails, setSelectedCampaignDetails] = useState(null);
  const [campaignDetailsLoading, setCampaignDetailsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10; // Number of campaigns per page

  const fetchMetrics = async (id) => {
    try {
      const response = await fetch(
        `https://email-sales-backend.onrender.com/campaign-metrics/${id}`
      );
      setEmailRecords([]);
      setCampaignStats({
        totalEmails: 0,
        successfulEmails: 0,
        failedEmails: 0,
        industries: {},
      });
      setIndustryData([]);
      const data = await response.json();
      if (!data.error) {
        setEmailMetrics(data.metrics);
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  // New function to fetch campaign details
  const fetchCampaignDetails = async (id) => {
    setCampaignDetailsLoading(true);
    try {
      const response = await fetch(
        `https://email-sales-backend.onrender.com/campaign-details/${id}`
      );
      const data = await response.json();
      if (!data.error) {
        setSelectedCampaignDetails(data);
      } else {
        console.error("Error in campaign details response:", data.error);
        alert("Failed to load campaign details.");
      }
    } catch (error) {
      console.error("Error fetching campaign details:", error);
      alert("Error loading campaign details.");
    } finally {
      setCampaignDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) {
      const interval = setInterval(() => {
        fetchMetrics(campaignId);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [campaignId]);

  useEffect(() => {
    const fetchAllCampaigns = async (page = 1) => {
      setAllCampaignsLoading(true);
      try {
        const response = await fetch(
          `https://email-sales-backend.onrender.com/all-campaigns/?page=${page}&page_size=${pageSize}`
        );
        const data = await response.json();
        console.log(data, "all campaings");
        setAllCampaigns(data.campaigns);
        setTotalPages(data.total_pages);
        setCurrentPage(data.current_page);
      } catch (error) {
        console.error("Error fetching all campaigns:", error);
        alert("Error loading all campaigns.");
      } finally {
        setAllCampaignsLoading(false);
      }
    };
    fetchAllCampaigns(currentPage);
  }, [showAllCampaigns, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setLoading(true);
      setResultsLoadingError(false);
      const startResponse = await fetch(
        "https://email-sales-backend.onrender.com/send-emails/",
        {
          method: "POST",
          body: formData,
        }
      );
      const startData = await startResponse.json();

      if (startData.campaign_id) {
        setCampaignId(startData.campaign_id);
        fetchMetrics(startData.campaign_id);
      }

      if (!startData.campaign_id) {
        alert("Failed to start campaign");
        return;
      }
    } catch (error) {
      console.error("Error starting campaign:", error);
      alert("Failed to start email campaign.");
    } finally {
      setLoading(false);
    }
  };

  const handleShowAllCampaignsClick = () => {
    setShowAllCampaigns(true);
    setSelectedCampaignDetails(null); // Reset selected campaign details
  };

  const handleHideAllCampaignsClick = () => {
    setShowAllCampaigns(false);
    setSelectedCampaignDetails(null); // Reset selected campaign details
  };

  // Handle clicking on a campaign row
  const handleCampaignClick = (campaign) => {
    fetchCampaignDetails(campaign.campaign_id);
  };

  // Handle going back from campaign details to campaign list
  const handleBackToCampaignList = () => {
    setSelectedCampaignDetails(null);
  };

  // Campaign details component
  const CampaignDetailsView = ({ campaignDetails, isLoading }) => {
    if (isLoading) {
      return (
        <div className="loading-indicator">Loading Campaign Details...</div>
      );
    }

    if (!campaignDetails) {
      return (
        <div className="error-message">No campaign details available.</div>
      );
    }

    return (
      <div className="campaign-details-container">
        <button onClick={handleBackToCampaignList} className="go-back-button">
          <ArrowLeft className="icon" />
          Back to campaign list
        </button>

        <Card className="campaign-details-card">
          <CardHeader>
            <CardTitle>
              Campaign Details: {campaignDetails?.campaign_id}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="campaign-summary">
              <div className="campaign-stat">
                <h3>Total Emails</h3>
                <p>{campaignDetails.summary.total_processed}</p>
              </div>
              <div className="campaign-stat">
                <h3>Successful</h3>
                <p>{campaignDetails.summary.successful_sends}</p>
              </div>
              <div className="campaign-stat">
                <h3>Failed</h3>
                <p>{campaignDetails.summary.failed_sends}</p>
              </div>
            </div>

            <div className="metrics-grid">
              <div className="metric-item">
                <h4>Open Rate</h4>
                <p>{campaignDetails.summary.open_rate.toFixed(2)}%</p>
                <small>{campaignDetails.summary.total_opens} opens</small>
              </div>

              <div className="metric-item">
                <h4>Bounce Rate</h4>
                <p>{campaignDetails.summary.bounce_rate.toFixed(2)}%</p>
                <small>{campaignDetails.summary.total_bounces} bounces</small>
              </div>

              <div className="metric-item">
                <h4>Reply Rate</h4>
                <p>{campaignDetails.summary.reply_rate.toFixed(2)}%</p>
                <small>{campaignDetails.summary.total_replies} replies</small>
              </div>

              <div className="metric-item">
                <h4>Unsubscribe Rate</h4>
                <p>{campaignDetails.summary.unsubscribe_rate.toFixed(2)}%</p>
                <small>
                  {campaignDetails.summary.total_unsubscribes} unsubscribes
                </small>
              </div>
            </div>

            {campaignDetails.industry_data &&
              campaignDetails.industry_data.length > 0 && (
                <div className="industry-chart-container">
                  <h3>Industry Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={campaignDetails.industry_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="industry" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          background: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="emails"
                        fill="#4F46E5"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

            {campaignDetails.all_emails &&
              campaignDetails.all_emails.length > 0 && (
                <div className="email-records-container">
                  <h3>Email Records</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Opened</th>
                          <th>Bounced</th>
                          <th>Replied</th>
                          <th>Unsubscribed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaignDetails.all_emails.map((record, index) => (
                          <tr key={index}>
                            <td>{record.email}</td>
                            <td>{record.opens ? "Yes" : "No"}</td>
                            <td>{record.bounced ? "Yes" : "No"}</td>
                            <td>{record.replied ? "Yes" : "No"}</td>
                            <td>{record.unsubscribed ? "Yes" : "No"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
    console.log(totalPages, "totalPagesasasdasdads");

    return (
      <Stack spacing={2} alignItems="center" sx={{ mt: 2 }}>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={(event, value) => onPageChange(value)}
          color="primary"
          shape="rounded"
          variant="outlined"
          size="large"
          sx={{ "& .MuiPaginationItem-root": { fontSize: "1rem" } }}
        />
      </Stack>
    );
  };

  //All campaigns details component
  const AllCampaignsDetails = ({
    campaigns,
    currentPage,
    totalPages,
    onPageChange,
  }) => {
    return (
      <Paper
        elevation={3}
        sx={{ padding: 3, margin: "20px", borderRadius: "10px" }}
      >
        <Typography variant="h5" gutterBottom align="center">
          All Campaigns
        </Typography>

        {loading ? (
          <Stack alignItems="center" sx={{ my: 4 }}>
            <CircularProgress size={50} />
          </Stack>
        ) : (
          <>
            {/* Table to display campaigns */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Campaign ID</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Total Emails</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Success</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Failed</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Open Rate</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Bounce Rate</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Reply Rate</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Unsubscribe Rate</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Date</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {campaigns?.map((campaign, index) => (
                    <TableRow
                      key={index}
                      hover
                      onClick={() => handleCampaignClick(campaign)}
                    >
                      <TableCell>{campaign.campaign_id}</TableCell>
                      <TableCell>{campaign.total_processed}</TableCell>
                      <TableCell>{campaign.successful_sends}</TableCell>
                      <TableCell>{campaign.failed_sends}</TableCell>
                      <TableCell>{campaign.metrics.open_rate}%</TableCell>
                      <TableCell>{campaign.metrics.bounce_rate}%</TableCell>
                      <TableCell>{campaign.metrics.reply_rate}%</TableCell>
                      <TableCell>
                        {campaign.metrics.unsubscribe_rate}%
                      </TableCell>
                      <TableCell>
                        {new Date(campaign.start_time).toLocaleString("en-US", {
                          month: "long",
                          day: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Controls */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </Paper>
    );
  };

  console.log(
    !showAllCampaigns,
    campaignId,
    !resultsLoadingError,
    "tesrsdssd",
    allCampaigns
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Email Campaign Dashboard</h1>
        <p className="subtitle">Monitor and manage your email campaigns</p>
      </div>
      {!showAllCampaigns && (
        <button
          onClick={handleShowAllCampaignsClick}
          className="view-all-campaigns-button"
        >
          View All Campaigns
        </button>
      )}

      {showAllCampaigns && (
        <div className="campaign-list-section">
          {!selectedCampaignDetails && (
            <>
              <button
                onClick={handleHideAllCampaignsClick}
                className="go-back-button"
              >
                <ArrowLeft className="icon" />
                Back to dashboard
              </button>
              {allCampaigns?.length > 0 && (
                <AllCampaignsDetails
                  campaigns={allCampaigns}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
              {allCampaigns?.length === 0 && !allCampaignsLoading && (
                <div className="no-campaigns-message">
                  No previous campaigns found.
                </div>
              )}
            </>
          )}

          {selectedCampaignDetails && (
            <CampaignDetailsView
              campaignDetails={selectedCampaignDetails}
              isLoading={campaignDetailsLoading}
            />
          )}
        </div>
      )}

      {!showAllCampaigns && (
        <>
          <Card className="upload-card">
            <CardHeader>
              <CardTitle>
                <Upload className="icon" />
                Upload Campaign Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="file-upload-container">
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    accept=".xlsx, .csv"
                    onChange={handleFileChange}
                    id="file-upload"
                    className="hidden-input"
                  />
                  <label htmlFor="file-upload" className="file-label">
                    <Upload className="upload-icon" />
                    <span>
                      {selectedFile ? selectedFile.name : "Choose a file"}
                    </span>
                  </label>
                </div>
                <button
                  onClick={handleSubmit}
                  className={`submit-button ${loading ? "loading" : ""}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Processing...
                    </>
                  ) : (
                    "Start Campaign"
                  )}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Stats Section */}
          {!resultsLoadingError && campaignId && (
            <div className="stats-grid">
              <Card className="stat-card">
                <CardContent>
                  <div className="stat-content">
                    <Mail className="stat-icon total" />
                    <div className="stat-info">
                      <h3>{campaignStats?.totalEmails}</h3>
                      <p>Total Emails</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardContent>
                  <div className="stat-content">
                    <CheckCircle className="stat-icon success" />
                    <div className="stat-info">
                      <h3>{campaignStats.successfulEmails}</h3>
                      <p>Successful</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardContent>
                  <div className="stat-content">
                    <AlertCircle className="stat-icon failed" />
                    <div className="stat-info">
                      <h3>{campaignStats.failedEmails}</h3>
                      <p>Failed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {!campaignId && (
            <div className="no-campaigns-message">
              No current campaign running.
            </div>
          )}
          {/* Display error if loading result failed */}
          {resultsLoadingError && campaignId && (
            <div className="error-message">
              Error loading campaign results. Please try again later.
            </div>
          )}
          {/* Enhanced Chart Section */}
          {!resultsLoadingError && campaignId && (
            <Card className="chart-card">
              <CardHeader>
                <CardTitle>Industry Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={industryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="industry" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="emails"
                      fill="#4F46E5"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Email Records Table */}
          {!resultsLoadingError && campaignId && (
            <Card className="table-card">
              <CardHeader>
                <CardTitle>
                  <Table className="icon" />
                  Email Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <></>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Industry</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emailRecords.map((record, index) => (
                        <tr key={index}>
                          <td>{record.email}</td>
                          <td>
                            <span className="industry-badge">
                              {record.industry}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${record.status}`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {campaignId && !resultsLoadingError && (
            <Card className="metrics-card">
              <CardHeader>
                <CardTitle>Email Campaign Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="metrics-grid">
                  <div className="metric-item">
                    <h4>Open Rate</h4>
                    <p>{emailMetrics.open_rate.toFixed(2)}%</p>
                    <small>{emailMetrics.total_opens} opens</small>
                  </div>

                  <div className="metric-item">
                    <h4>Bounce Rate</h4>
                    <p>{emailMetrics.bounce_rate.toFixed(2)}%</p>
                    <small>{emailMetrics.total_bounces} bounces</small>
                  </div>

                  <div className="metric-item">
                    <h4>Reply Rate</h4>
                    <p>{emailMetrics.reply_rate.toFixed(2)}%</p>
                    <small>{emailMetrics.total_replies} replies</small>
                  </div>

                  <div className="metric-item">
                    <h4>Unsubscribe Rate</h4>
                    <p>{emailMetrics.unsubscribe_rate.toFixed(2)}%</p>
                    <small>
                      {emailMetrics.total_unsubscribes} unsubscribes
                    </small>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default EmailDashboard;
