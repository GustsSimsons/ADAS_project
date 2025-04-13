const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
const PORT = 3000;
const db = require('./db/database');


// Middleware to handle JSON and serve static files
app.use(bodyParser.json());
app.use(express.static('public'));

// Session middleware
app.use(session({
  secret: 'very-safe-very-good',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60, 
  },
}));




// Handle login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body; // username = first_name, password = last_name

  const sql = `
    SELECT * FROM employees 
    WHERE first_name = ? AND last_name = ?
  `;

  db.get(sql, [username, password], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }

    if (row) {
      // Successful login
      req.session.user = {
        id: row.employee_id,
        first_name: row.first_name,
        last_name: row.last_name,
        role: row.status, // 'low', 'mid', 'high'
        email: row.email
      };
      res.json({ success: true });
    } else {
      // No match
      res.json({ success: false, message: 'Invalid credentials' });
    }
  });
});

// Check authentication status
app.get('/api/check-auth', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// Handle logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.json({ success: false, message: 'Error logging out' });
    }
    res.clearCookie('connect.sid', { path: '/' }); // Explicitly clear the session cookie
    res.json({ success: true });
  });
});








app.post('/api/send-petition', (req, res) => {
  const { employee_id, plan_id, task_description, task_priority, task_deadline, CS_comments, CTO_comments } = req.body;

  // Check if the required fields are present
  if (!employee_id || !plan_id || !task_description || !task_deadline || !task_priority) {
    return res.status(400).json({ success: false, message: 'Employee ID, Plan ID, Task Description, Task Deadline, and Task Priority are required.' });
  }

  // Check if the priority is valid
  const validPriorities = ['weak', 'average', 'strong'];
  if (!validPriorities.includes(task_priority)) {
    return res.status(400).json({ success: false, message: 'Task Priority must be one of: weak, average, or strong.' });
  }

  // Insert petition into the petition table
  const stmt = db.prepare(`
    INSERT INTO petition (employee_id, plan_id, task_description, task_priority, task_deadline, CS_comments, CTO_comments)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    employee_id,
    plan_id,
    task_description,
    task_priority,
    task_deadline,
    CS_comments || null,
    CTO_comments || null,
    function(err) {
      if (err) {
        console.error('Error inserting petition:', err.message);
        return res.status(500).json({ success: false, message: 'Error saving petition' });
      }
      res.json({ success: true, message: 'Petition submitted successfully' });
    }
  );
});



// Fetch the first petition or a random petition
app.get('/api/get-petition', (req, res) => {
  const query = `
    SELECT * FROM petition
    ORDER BY RANDOM()
    LIMIT 1;
  `;
  
  db.get(query, [], (err, row) => {
    if (err) {
      console.error('Error fetching petition:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ success: false, message: 'No petition found' });
    }
    res.json({ success: true, petition: row });
  });
});




// Approve Task: Move data from petition to tasks and Task_assignment
app.post('/api/approve-task', (req, res) => {
  const petitionId = req.body.petitionId; // This should be the ID of the petition to approve

  // Fetch petition details first to use when adding to tasks table
  const petitionQuery = `
    SELECT * FROM petition WHERE petition_id = ?
  `;

  db.get(petitionQuery, [petitionId], (err, petition) => {
    if (err) {
      console.error('Error fetching petition:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!petition) {
      return res.status(404).json({ success: false, message: 'Petition not found' });
    }

    // Insert into tasks table
    const insertTaskQuery = `
      INSERT INTO tasks (plan_id, description, deadline, priority, CS_comments, CTO_comments)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(insertTaskQuery, [
      petition.plan_id,
      petition.task_description,
      petition.task_deadline,
      petition.task_priority,
      petition.CS_comments,
      petition.CTO_comments
    ], function (err) {
      if (err) {
        console.error('Error inserting into tasks:', err);
        return res.status(500).json({ success: false, message: 'Failed to insert task' });
      }

      const taskId = this.lastID; // Get the ID of the newly inserted task

      // Insert into Task_assignment table
      const insertTaskAssignmentQuery = `
        INSERT INTO Task_assignment (task_id, employee_id, assigned_date)
        VALUES (?, ?, ?)
      `;

      const assignedDate = new Date().toISOString().split('T')[0]; // Get the current date in YYYY-MM-DD format

      db.run(insertTaskAssignmentQuery, [taskId, petition.employee_id, assignedDate], (err) => {
        if (err) {
          console.error('Error inserting into Task_assignment:', err);
          return res.status(500).json({ success: false, message: 'Failed to assign task' });
        }

        // Delete the petition from the petition table
        const deletePetitionQuery = `
          DELETE FROM petition WHERE petition_id = ?
        `;

        db.run(deletePetitionQuery, [petitionId], (err) => {
          if (err) {
            console.error('Error deleting petition:', err);
            return res.status(500).json({ success: false, message: 'Failed to delete petition' });
          }

          res.json({ success: true, message: 'Task approved and moved to tasks table' });
        });
      });
    });
  });
});


















app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
