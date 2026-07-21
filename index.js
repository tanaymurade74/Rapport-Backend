const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.set("trust proxy", 1);

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

const Lead = require("./models/lead.model.js");
const SalesAgent = require("./models/salesAgent.model.js");
const Comment = require("./models/comment.model.js");
const Tag = require("./models/tag.model.js");
const RapportUser = require("./models/rapportUser.model.js");

let dbPromise = null;
const connectDB =  () => {
  if(mongoose.connection.readyState === 1){
    return Promise.resolve();
  }
  if(!dbPromise){
    dbPromise = mongoose.connect(process.env.MONGODB)
  }
  return dbPromise;
}

const { initializeDatabase } = require("./db/db.connect.js");

const dbReady = initializeDatabase();

app.use(async (req, res, next) => {
  try {
    await dbReady;
    next();
  } catch (e) {
    dbReady = initializeDatabase();
    res.status(503).json({ Error: "Starting up, please try again" });
  }
});

const BACKEND_URL =
"https://crm-backend-wlhu.vercel.app";
const FRONTEND_URL =
  "https://rapport-frontend-two.vercel.app";
const REDIRECT_URI = `${BACKEND_URL}/auth/google/callback`;

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

app.get("/auth/me", verifyToken, async (req, res) => {
  res.json({ userId: req.user.userId });
});




app.get("/auth/login", async (req, res) => {
  const googleUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email`;
  res.redirect(googleUrl);
});

app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ message: "Authorization code not provided" });
  }
  try {
    const googleTokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const googleAccessToken = googleTokenResponse.data.access_token;

    const profileResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
        },
      }
    );

    const email = profileResponse.data.email;
    await connectDB();
    let user = await RapportUser.findOne({ email });
    if (!user) {
      user = await RapportUser.create({ email });
    }

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "12h",
    });

    res.redirect(`${FRONTEND_URL}/oauth-success?token=${jwtToken}`);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Google authentication failed" });
  }
});

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

async function createLead(lead) {
  try {
    const newLead = new Lead(lead);
    const createdLead = await newLead.save();
    console.log(createdLead);
    return createdLead;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function getAllLeads(filter = {}) {
  try {
    const leads = await Lead.find(filter);
    console.log(leads);
    return leads;
  } catch (error) {
    throw error;
  }
}

async function deleteAgent(id){
    try{
        const deletedAgent = await SalesAgent.findByIdAndDelete(id);
        console.log(deletedAgent);
        return deletedAgent;
    }catch(error){
        throw error;
    }
}


async function deleteLead(id) {
  try {
    const deletedLead = await Lead.findByIdAndDelete(id);
    console.log(deletedLead);
    return deletedLead;
  } catch (error) {
    throw error;
  }
}

async function updateLeadById(id, lead) {
  try {
    const updatedLead = await Lead.findByIdAndUpdate({ _id: id }, lead, {
      new: true,
    });
    return updatedLead;
  } catch (error) {
    throw error;
  }
}

async function createSalesAgent(agent) {
  try {
    const newAgent = new SalesAgent(agent);
    const createdAgent = await newAgent.save();
    return createdAgent;
  } catch (error) {
    throw error;
  }
}

async function getAllSalesAgent() {
  try {
    const agents = await SalesAgent.find();
    return agents;
  } catch (error) {
    throw error;
  }
}

async function getSalesAgentById(id){
    try{
        const agent = await SalesAgent.find({_id: id});
        return agent;
    }catch(error){
        throw error;
    }
}

async function addCommentToLead(leadId, commentData) {
  try {
    const newComment = new Comment({
      lead: leadId,
      commentText: commentData.commentText,
      author: commentData.author,
      createdAt: new Date(),
    });
    const savedComment = await newComment.save();
    return savedComment;
  } catch (error) {
    throw error;
  }
}

async function getCommentsForLead(leadId) {
  try {
    const comments = await Comment.find({ lead: leadId });
    return comments;
  } catch (error) {
    throw error;
  }
}

async function deleteComment(id){
    try{
        const comment = await Comment.findByIdAndDelete(id);
        return comment;
    }catch(error){
        throw error;
    }
}

async function createTag(tag) {
  try {
    const newTag = new Tag(tag);
    const createdTag = await newTag.save();
    return createdTag;
  } catch (error) {
    throw error;
  }
}

async function getAllTags() {
  try {
    const tags = await Tag.find();
    return tags;
  } catch (error) {
    throw error;
  }
}

async function leadsClosedLastWeek() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const leads = await Lead.find({ closedAt: { $gte: sevenDaysAgo } });
    return leads;
  } catch (error) {
    throw error;
  }
}

async function totalLeadsInPipeline() {
  try {
    const leads = await Lead.countDocuments({ status: { $ne: "Closed" } });
    return leads;
  } catch (error) {
    throw error;
  }
}


async function getByLeadName(name){
    try{
        const pattern = name.split("").join(".*")
        const regex = new RegExp(pattern, "i")
        const product = await Lead.find({name: {$regex: regex}})
        return product;
    }catch(error){
        console.log(error)
    }
}

app.delete("/comments/:commentId", verifyToken, async (req, res)=>{
    try{
        const comment = await deleteComment(req.params.commentId);
        if(!comment){
            return res.status(404).json({Error: "No comment found"})
        }
        return res.status(200).json({Comment: comment})
    }catch{
        return res.status(500).json({Error: "Error occurred while trying to delete comment"})
    }
})

app.get("/leads/search/:searchTerm", verifyToken, async (req, res)=>{
    try{
        const param = req.params.searchTerm;
        const leadName = decodeURIComponent(param).trim().toLowerCase();
        const lead = await getByLeadName(leadName)
        if(leadName.length === 0){
            return res.status(404).json({Error: "Product not found"})
        }
        return res.status(200).json({Leads: lead})

    }catch{
        return res.status(500).json({Error: "Error while trying to fetch leads"})
    }
})

app.get("/report/last-week", verifyToken, async (req, res) => {
  try {
    const leadsClosed = await leadsClosedLastWeek();
    if (leadsClosed.length === 0) {
      return res
        .status(404)
        .json({ Error: "No leads were closed in the past week" });
    }
    return res
      .status(200)
      .json(
        leadsClosed.map((lead) => ({
          id: lead._id,
          name: lead.name,
          salesAgent: lead.salesAgent,
          closedAt: lead.closedAt,
        }))
      );
  } catch {
    return res.status(500).json({ Error: "Error while trying to fetch leads" });
  }
});

app.get("/report/pipeline", verifyToken, async (req, res) => {
  try {
    const count = await totalLeadsInPipeline();
    return res.status(200).json({ totalPipelineLeads: count });
  } catch {
    return res
      .status(500)
      .json({ Error: "Error occurred while trying to fetch reports" });
  }
});

app.get("/agents", verifyToken, async (req, res) => {
  try {
    const allAgents = await getAllSalesAgent();
    if (!allAgents) {
      return res.status(404).json({ Error: "No salesAgent found" });
    }
    return res.status(200).json({ agents: allAgents });
  } catch {
    return res
      .status(500)
      .json({ Error: "Error occurred while trying to get all salesAgents" });
  }
});

app.post("/agents", verifyToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and Email are required." });
    }
    const createdAgent = await createSalesAgent(req.body);
    return res.status(201).json({ agent: createdAgent });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: `Sales agent with email '${req.body.email}' already exists.`,
      });
    }
    return res
      .status(500)
      .json({ Error: "Error occurred while trying to create salesAgent" });
  }
});


app.get("/agents/:id", verifyToken, async (req, res) => {
    try{
        const agent = await getSalesAgentById(req.params.id);
        return res.status(200).json(agent);
    }catch{
        return res.status(500).json({Error: "Error occurred while trying to fetch the salesAgent."})
    }
})

app.delete("/agents/:id", verifyToken, async (req, res)=>{
    try{
        const deletedAgent = await deleteAgent(req.params.id);
        return res.status(200).json(deletedAgent);
    }catch{
        return res.status(500).json({Error: "Error occurred while trying to delete salesAgent"})
    }
})

app.get("/leads", verifyToken, async (req, res) => {
  try {
    const { _id, salesAgent, status, tags, source } = req.query;
    const filter = {};
    const allowedStatuses = [
      "New",
      "Contacted",
      "Qualified",
      "Proposal Sent",
      "Closed",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json({
          error: "Invalid input: 'status' must be one of the allowed values.",
        });
    }
    if (salesAgent && !isValidId(salesAgent)) {
      return res.status(400).json({ error: "Invalid Sales Agent ID format." });
    }
    if (salesAgent) {
      filter.salesAgent = salesAgent;
    }
    if (status) {
      filter.status = status;
    }
    if (tags) {
      filter.tags = tags;
    }
    if (source) {
      filter.source = source;
    }
    if(_id){
        filter._id = _id;
    }

    const leads = await getAllLeads(filter);
    if (leads.length === 0) {
      return res.status(404).json({ Error: "No leads found." });
    }
    return res.status(200).json({ Leads: leads });
  } catch {
    return res
      .status(500)
      .json({ Error: "Error while trying to get all leads." });
  }
});

app.post("/leads", verifyToken, async (req, res) => {
  try {
    const { salesAgent, name, source, tags, priority, timeToClose } = req.body;

    if (!name || !source) {
      return res
        .status(400)
        .json({ error: "Invalid input: 'name' and 'source' are required." });
    }

    if (salesAgent) {
      if (!isValidId(salesAgent)) {
        return res
          .status(400)
          .json({ error: "Invalid Sales Agent ID format." });
      }
      const agentExists = await SalesAgent.findById(salesAgent);
      if (!agentExists) {
        return res
          .status(404)
          .json({ error: `Sales agent with ID '${salesAgent}' not found.` });
      }
    }
    const createdLead = await createLead(req.body);
    return res.status(201).json({ Lead: createdLead });
  } catch {
    return res
      .status(500)
      .json({ Error: "Error occurred while trying to create new lead" });
  }
});

app.delete("/leads/:id", verifyToken, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: "Invalid Lead ID format." });
    }

    const deletedLead = await deleteLead(req.params.id);

    if (!deletedLead) {
      return res
        .status(404)
        .json({ error: `Lead with ID '${req.params.id}' not found` });
    }
    return res.status(200).json({ message: "Lead deleted successfully" });
  } catch {
    return res
      .status(500)
      .json({ Error: "Error occurred while trying to delete" });
  }
});

app.put("/leads/:id", verifyToken, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: "Invalid Lead ID format." });
    }
    let updateData = req.body;
    if (updateData.status === "Closed") {
      updateData.closedAt = new Date();
    }

    const updatedLead = await updateLeadById(req.params.id, req.body);

    if (!updatedLead) {
      return res
        .status(404)
        .json({ error: `Lead with ID '${req.params.id}' not found` });
    }
    return res.status(200).json({ Lead: updatedLead });
  } catch {
    return res
      .status(500)
      .json({ Error: "Error occurred while trying to update lead" });
  }
});

app.post("/leads/:id/comments", verifyToken, async (req, res) => {
  try {
    const leadId = req.params.id;
    const { commentText, author } = req.body;
    const leadExists = await Lead.findById(leadId);
    if (!leadExists) {
      return res
        .status(404)
        .json({ error: `Lead with ID '${leadId}' not found.` });
    }

    const savedComment = await addCommentToLead(leadId, {
      commentText,
      author,
    });

    return res.status(201).json(savedComment);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ Error: "Error occurred while adding comment." });
  }
});

app.get("/leads/:id/comments", verifyToken, async (req, res) => {
  try {
    const leadId = req.params.id;
    const comments = await getCommentsForLead(leadId);
    if (comments.length === 0) {
      return res.status(404).json({ Error: "No comments found for the lead" });
    }
    return res.status(200).json({ comments: comments });
  } catch {
    return res
      .status(500)
      .json({
        Error: "Error occurred while trying to fetch all comments for the lead",
      });
  }
});

app.post("/tag", verifyToken, async (req, res) => {
  try {
    const tag = req.body;
    if (!tag.name) {
      return res.status(400).json({ Error: "Tag name is required" });
    }
    const createdTag = await createTag(tag);
    return res.status(200).json({ tag: createdTag });
  } catch {
    return res
      .status(500)
      .json({ Error: "An error occurred while trying to create tag" });
  }
});

app.get("/tag", verifyToken, async (req, res) => {
  try {
    const tag = await getAllTags();
    if (tag.length === 0) {
      return res.status(404).json({ Error: "No tags found" });
    }
    return res.status(200).json({ tag: tag });
  } catch {
    return res
      .status(500)
      .json({ Error: "An error occurred while trying to get all tags" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server running on port 3000");
});