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
import { Mail, CheckCircle, AlertCircle, Upload, Table, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import './EmailDashboard.css';

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
        total_unsubscribes: 0
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

    const fetchMetrics = async (id) => {
        try {
            const response = await fetch(`https://email-sales-backend.onrender.com/campaign-metrics/${id}`);
            const data = await response.json();
            if (!data.error) {
                setEmailMetrics(data.metrics);
            }
        } catch (error) {
            console.error("Error fetching metrics:", error);
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
        const fetchAllCampaigns = async () => {
            setAllCampaignsLoading(true);
            try {
                const response = await fetch(`http://127.0.0.1:8000/all-campaigns/`);
                const data = await response.json();
                console.log(data, 'all campaings');
                setAllCampaigns(data);
            } catch (error) {
                console.error("Error fetching all campaigns:", error);
                alert("Error loading all campaigns.");
            } finally {
                setAllCampaignsLoading(false);
            }
        };
        fetchAllCampaigns();
    }, [showAllCampaigns]);

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
            const startResponse = await fetch("https://email-sales-backend.onrender.com/send-emails/", {
                method: "POST",
                body: formData,
            });
            const startData = await startResponse.json();

            if (startData.campaign_id) {
                setCampaignId(startData.campaign_id);
                fetchMetrics(startData.campaign_id);
                const fetchResults = async () => {
                    try {
                        const response = await fetch(
                            `https://email-sales-backend.onrender.com/campaign-results/?campaign_id=${startData.campaign_id}`
                        );
                        if (response.ok) {
                            const data = await response.json();

                            if (data.status === "Processing") {
                                setTimeout(fetchResults, 10000);
                            } else {
                                setCampaignStats(data);
                                setIndustryData(
                                    Object.entries(data.industries).map(([industry, count]) => ({
                                        industry,
                                        emails: count,
                                    }))
                                );
                                alert(
                                    `Campaign Completed!\nSuccess: ${data.successfulEmails}\nFailed: ${data.failedEmails}`
                                );
                            }
                        } else if (response.status === 404) {
                            setResultsLoadingError(true);
                            console.error("Campaign results not found (404)");
                        } else {
                            setResultsLoadingError(true);
                            console.error("Error fetching results (non-404):", response.status, response.statusText);
                        }
                    } catch (error) {
                        setResultsLoadingError(true);
                        console.error("Error fetching campaign results:", error);
                    }
                };
                // fetchResults();
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
    };

    const handleHideAllCampaignsClick = () => {
        setShowAllCampaigns(false);
    };

    //All campaigns details component
    const AllCampaignsDetails = ({ campaigns }) => {
        return (
            <Card className="table-card">
                <CardHeader>
                    <CardTitle>
                        <Table className="icon" />
                        All Campaigns Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {allCampaignsLoading ? (
                        <div className="loading-indicator">Loading Campaigns...</div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Campaign ID</th>
                                        <th>Total Emails</th>
                                        <th>Success</th>
                                        <th>Failed</th>
                                        <th>Open Rate</th>
                                        <th>Bounce Rate</th>
                                        <th>Reply Rate</th>
                                        <th>Unsubscribe Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns?.map((campaign, index) => (
                                      console.log(campaign,'campaigndsdsdsdsd'),
                                        <tr key={index}>
                                            <td>{campaign.campaign_id}</td>
                                            <td>{campaign.total_processed}</td>
                                            <td>{campaign.successful_sends}</td>
                                            <td>{campaign.failed_sends}</td>
                                            <td>{campaign.metrics.open_rate}%</td>
                                            <td>{campaign.metrics.bounce_rate}%</td>
                                            <td>{campaign.metrics.reply_rate}%</td>
                                            <td>{campaign.metrics.unsubscribe_rate}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };
    console.log(!showAllCampaigns, campaignId, !resultsLoadingError, 'tesrsdssd',allCampaigns);

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Email Campaign Dashboard</h1>
                <p className="subtitle">Monitor and manage your email campaigns</p>
            </div>
            {!showAllCampaigns && (
                <button onClick={handleShowAllCampaignsClick} className="view-all-campaigns-button">View All Campaigns</button>
            )}

            {showAllCampaigns && (
                <div className="campaign-list-section">
                    <button onClick={handleHideAllCampaignsClick} className="go-back-button">
                        <ArrowLeft className="icon" />
                        Back to dashboard
                    </button>
                    {allCampaigns?.length > 0 && <AllCampaignsDetails campaigns={allCampaigns} />}
                    {allCampaigns?.length === 0 && !allCampaignsLoading && (
                        <div className="no-campaigns-message">No previous campaigns found.</div>
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
                    { !resultsLoadingError && campaignId && (
                        <div className="stats-grid">
                            <Card className="stat-card">
                                <CardContent>
                                    <div className="stat-content">
                                        <Mail className="stat-icon total" />
                                        <div className="stat-info">
                                            <h3>{campaignStats.totalEmails}</h3>
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
                        <div className="no-campaigns-message">No current campaign running.</div>
                    )}
                    {/* Display error if loading result failed */}
                    { resultsLoadingError && campaignId && (
                        <div className="error-message">
                            Error loading campaign results. Please try again later.
                        </div>
                    )}
                    {/* Enhanced Chart Section */}
                    { !resultsLoadingError && campaignId && (
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
                                        <Bar dataKey="emails" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {/* Enhanced Email Records Table */}
                    { !resultsLoadingError && campaignId && (
                        <Card className="table-card">
                            <CardHeader>
                                <CardTitle>
                                    <Table className="icon" />
                                    Email Records
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <>

                                </>
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
                                                        <span className="industry-badge">{record.industry}</span>
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
                                        <small>{emailMetrics.total_unsubscribes} unsubscribes</small>
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
