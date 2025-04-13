const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('./db/database');
const app = express();
const PORT = 3000;

const upload = multer({ storage: multer.memoryStorage() });
const FINANSE_PATH = path.join(__dirname, 'Finanse');


app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
  secret: 'very-safe-very-good',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60,
  },
}));


app.post('/upload-budget', upload.single('budget'), (req, res) => {
    const budgetId = req.body.budgetId;

    if (!req.file || !budgetId) {
        return res.status(400).send('Missing file or budget ID.');
    }

    const draftFolderName = `Draft${budgetId}`;
    const draftFolderPath = path.join(FINANSE_PATH, draftFolderName);
    const budgetFilename = `budget${budgetId}.xlsx`;
    const budgetFilePath = path.join(draftFolderPath, budgetFilename);

    if (!fs.existsSync(FINANSE_PATH)) {
        fs.mkdirSync(FINANSE_PATH);
    }

    if (!fs.existsSync(draftFolderPath)) {
        fs.mkdirSync(draftFolderPath);
    }

    const existingFiles = fs.readdirSync(draftFolderPath);
    existingFiles.forEach(file => {
        if (file.startsWith('budget')) {
            fs.unlinkSync(path.join(draftFolderPath, file));
        }
    });

    fs.writeFileSync(budgetFilePath, req.file.buffer);

    res.send(`Budget uploaded to ${draftFolderName}/${budgetFilename}`);
});

app.post('/upload-analysis', upload.single('analysis'), (req, res) => {
  const budgetId = req.body.budgetId;

  if (!req.file || !budgetId) {
      return res.status(400).send('Missing file or budget ID.');
  }

  const draftFolderName = `Draft${budgetId}`;
  const draftFolderPath = path.join(FINANSE_PATH, draftFolderName);
  const analysisFilename = `analysis${budgetId}.xlsx`;
  const analysisFilePath = path.join(draftFolderPath, analysisFilename);

  if (!fs.existsSync(FINANSE_PATH)) {
      fs.mkdirSync(FINANSE_PATH);
  }

  if (!fs.existsSync(draftFolderPath)) {
      fs.mkdirSync(draftFolderPath);
  }

  const existingFiles = fs.readdirSync(draftFolderPath);
  existingFiles.forEach(file => {
      if (file.startsWith('analysis')) {
          fs.unlinkSync(path.join(draftFolderPath, file));
      }
  });

  fs.writeFileSync(analysisFilePath, req.file.buffer);

  res.send(`Analysis uploaded to ${draftFolderName}/${analysisFilename}`);
});

app.post('/submit-feedback', (req, res) => {
  const { feedback, budgetId } = req.body;

  if (!feedback || !budgetId) {
      return res.status(400).send('Missing feedback or budget ID.');
  }

  const draftFolderName = `Draft${budgetId}`;
  const draftFolderPath = path.join(FINANSE_PATH, draftFolderName);

  if (!fs.existsSync(FINANSE_PATH)) {
      fs.mkdirSync(FINANSE_PATH);
  }

  if (!fs.existsSync(draftFolderPath)) {
      fs.mkdirSync(draftFolderPath);
  }

  let baseFilename = `feedback${budgetId}.txt`;
  let filePath = path.join(draftFolderPath, baseFilename);
  let counter = 1;

  while (fs.existsSync(filePath)) {
      baseFilename = `feedback${budgetId}_${counter}.txt`;
      filePath = path.join(draftFolderPath, baseFilename);
      counter++;
  }

  fs.writeFileSync(filePath, feedback, 'utf-8');

  res.send(`Feedback saved as ${baseFilename}`);
});


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
      req.session.user = {
        id: row.employee_id,
        first_name: row.first_name,
        last_name: row.last_name,
        role: row.status, // 'low', 'mid', 'high'
        email: row.email
      };
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  });
});

app.get('/api/check-auth', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});


app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.json({ success: false, message: 'Error logging out' });
    }
    res.clearCookie('connect.sid', { path: '/' });
    res.json({ success: true });
  });
});




app.post('/api/send-petition', (req, res) => {
  const { employee_id, plan_id, task_description, task_priority, task_deadline, CS_comments, CTO_comments } = req.body;

  if (!employee_id || !plan_id || !task_description || !task_deadline || !task_priority) {
    return res.status(400).json({ success: false, message: 'Employee ID, Plan ID, Task Description, Task Deadline, and Task Priority are required.' });
  }

  const validPriorities = ['weak', 'average', 'strong'];
  if (!validPriorities.includes(task_priority)) {
    return res.status(400).json({ success: false, message: 'Task Priority must be one of: weak, average, or strong.' });
  }

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



app.post('/api/approve-task', (req, res) => {
  const petitionId = req.body.petitionId; 

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

      const taskId = this.lastID;

      const insertTaskAssignmentQuery = `
        INSERT INTO Task_assignment (task_id, employee_id, assigned_date)
        VALUES (?, ?, ?)
      `;

      const assignedDate = new Date().toISOString().split('T')[0];

      db.run(insertTaskAssignmentQuery, [taskId, petition.employee_id, assignedDate], (err) => {
        if (err) {
          console.error('Error inserting into Task_assignment:', err);
          return res.status(500).json({ success: false, message: 'Failed to assign task' });
        }

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
