const Note = require("../models/Notes");  
const mongoose = require("mongoose");  

/**  
 * GET /  
 * Dashboard  
 */  
exports.dashboard = async (req, res) => {  
  let perPage = 12;  
  let page = req.query.page || 1;  

  const locals = {  
    title: "Dashboard",  
    description: "Free NodeJS Notes App.",  
  };  

  try {  
    // Validate the user ID to ensure it's a valid ObjectId  
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {  
      return res.status(400).send('Invalid user ID');  
    }  

    // Fetch notes with the corrected ObjectId instantiation  
    const notes = await Note.aggregate([  
      { $sort: { updatedAt: -1 } },  
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },  // Use 'new' keyword explicitly  
      {  
        $project: {  
          title: { $substr: ["$title", 0, 30] },  
          body: { $substr: ["$body", 0, 100] },  
        },  
      },  
    ])  
    .skip(perPage * page - perPage)  
    .limit(perPage)  
    .exec();  

    const count = await Note.countDocuments({ user: req.user.id }); // Count notes for the specific user  

    res.render('dashboard/index', {  
      userName: req.user.firstName,  
      locals,  
      notes,  
      layout: "../views/layouts/dashboard",  
      current: page,  
      pages: Math.ceil(count / perPage),  
    });  

  } catch (error) {  
    console.error(error); // Improved error logging  
    res.status(500).send('Server Error');  
  }  
};  

/**  
 * GET /  
 * View Specific Note  
 */  
exports.dashboardViewNote = async (req, res) => {  
  try {  
    const note = await Note.findById(req.params.id)  
      .where({ user: req.user.id })  
      .lean();  

    if (note) {  
      res.render("dashboard/view-note", {  
        noteID: req.params.id,  
        note,  
        layout: "../views/layouts/dashboard",  
      });  
    } else {  
      res.status(404).send("Note not found.");  
    }  
  } catch (error) {  
    console.error(error);  
    res.status(500).send('Server Error');  
  }  
};  

/**  
 * PUT /  
 * Update Specific Note  
 */  
exports.dashboardUpdateNote = async (req, res) => {  
  try {  
    await Note.findOneAndUpdate(  
      { _id: req.params.id, user: req.user.id }, // Ensure the user is also matched  
      { title: req.body.title, body: req.body.body, updatedAt: Date.now() }  
    );  
    res.redirect("/dashboard");  
  } catch (error) {  
    console.error(error);  
    res.status(500).send('Server Error');  
  }  
};  

/**  
 * DELETE /  
 * Delete Note  
 */  
exports.dashboardDeleteNote = async (req, res) => {  
  try {  
    await Note.deleteOne({ _id: req.params.id, user: req.user.id }); // Ensure the user is also matched  
    res.redirect("/dashboard");  
  } catch (error) {  
    console.error(error);  
    res.status(500).send('Server Error');  
  }  
};  

/**  
 * GET /  
 * Add Notes  
 */  
exports.dashboardAddNote = async (req, res) => {  
  res.render("dashboard/add", {  
    layout: "../views/layouts/dashboard",  
  });  
};  

/**  
 * POST /  
 * Add Notes  
 */  
exports.dashboardAddNoteSubmit = async (req, res) => {  
  try {  
    req.body.user = req.user.id;  
    await Note.create(req.body);  
    res.redirect("/dashboard");  
  } catch (error) {  
    console.error(error);  
    res.status(500).send('Server Error');  
  }  
};  

/**  
 * GET /  
 * Search  
 */  
exports.dashboardSearch = async (req, res) => {  
  try {  
    res.render("dashboard/search", {  
      searchResults: "",  
      layout: "../views/layouts/dashboard",  
    });  
  } catch (error) {  
    console.error(error);  
    res.status(500).send('Server Error');  
  }  
};  

/**  
 * POST /  
 * Search For Notes  
 */  
exports.dashboardSearchSubmit = async (req, res) => {  
  try {  
    let searchTerm = req.body.searchTerm;  
    const searchNoSpecialChars = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");  

    const searchResults = await Note.find({  
      $or: [  
        { title: { $regex: new RegExp(searchNoSpecialChars, "i") } },  
        { body: { $regex: new RegExp(searchNoSpecialChars, "i") } },  
      ],  
    }).where({ user: req.user.id });  

    res.render("dashboard/search", {  
      searchResults,  
      layout: "../views/layouts/dashboard",  
    });  
  } catch (error) {  
    console.error(error);  
    res.status(500).send('Server Error');  
  }  
};