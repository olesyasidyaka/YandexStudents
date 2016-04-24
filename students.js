"use strict";

// student constructor
function Student(surname, name, id) {
	this.surname = surname;
	this.name = name;

	if (id !== undefined) {
		this.id = id;
		Student.count = Math.max(Student.count, id);
	} else {
		this.id = Student.count;
		Student.count++;
	}
	
	Object.defineProperty(this, "fullName", {
		get: function() {
			return this.surname + ' ' + this.name;
		}
	});
}
Student.count = 0;

// teacher constructor
function Teacher(surname, name, id) {
	this.surname = surname;
	this.name = name;

	if (id !== undefined) {
		this.id = id;
		Teacher.count = Math.max(Teacher.count, id);
	} else {
		this.id = Teacher.count;
		Teacher.count++;
	}

	Object.defineProperty(this, "fullName", {
		get: function() {
			return this.surname + ' ' + this.name;
		}
	});
}
Teacher.count = 0;

// school constructor, main class to deal with all tasks, teams and marks
function School() {
	this.students = [];
	this.teachers = [];
	this.tasks = [];
	this.studentsLists = [];
	this.teachersLists = [];
	
	// students methods
	this.addStudent = function(student) {
		this.students[student.id] = student;
		this.studentsLists[student.id] = [];
	}
	this.showStudents = function() {
		var str = '';
		for (var st in this.students)
			str += this.students[st].id + ' ' + this.students[st].fullName + '\n';
		return str;
	}

	// teachers methods
	this.addTeacher = function(teacher) {
		this.teachers[teacher.id] = teacher;
		this.teachersLists[teacher.id] = [];
	}
	this.showTeachers = function(student) {
		var str = '';
		for (var t in this.teachers)
			str += this.teachers[t].id + ' ' + this.teachers[t].fullName + '\n';
		return str;
	}

	// task constructor, each task contains its description and its teams and marks
	function Task(type, description) {
		this.type = type;				// type = 'individual', 'team'
		this.id = Task.count;			// unic id
		this.description = description;	// some description
		if (type == 'team')	{
			this.teams = [];			// teams of students if task is team
			this.studentsInTeams = {}; 	// stores team for student to avoid multiple teams for one student
		}
		this.marks = {};				// marks of task for all students

		Task.count++;

		// teams
		function Team() {
			this.students = [];
			this.id = Team.count;

			Team.count++;

			this.addStudent = function(studentId) {
				this.students.push(studentId);
			}
		}
		Team.count = 0;

		this.addTeam = function() {
			var team = new Team();

			if (this.type == 'team') {
				var students = arguments[0];//Array.prototype.slice.call(arguments, 1);
				for (var i = 0; i < students.length; i++)
				{
					if (this.studentsInTeams[students[i]] !== undefined)
						console.log('Error: student ' + students[i] + ' already in team ' + 
							this.studentsInTeams[students[i]] + ' for task ' + team.id);
					else {
						this.studentsInTeams[students[i]] = team.id;
						team.addStudent(students[i]);
					}
				}
				this.teams.push(team);
				return team.id;
			}
			else
				console.log('Error: adding team to individual task\n');
		}

		// marks
		this.addStudentMark = function(mark, studentId) {
			this.marks[studentId] = mark;
		}
		this.addTeamMark = function(mark, teamId) {
			if (this.type == 'team') {
				console.log(this);
				var team = this.teams[teamId].students;
				for (var tm in team)
					this.addStudentMark(mark, team[tm]);
			}
			else {
				console.log('Error: adding team mark to individual task ' + this.id);
			}
		}
		this.showStudentMarks = function(studentId) {
			return 'task: ' + this.id + ' mark: ' + this.marks[studentId];
		}
	}
	Task.count = 0;

	// tasks methods
	this.addTask = function(type, description) {
		var t = new Task(type, description);
		this.tasks.push(t);

		return t.id;
	}
	// teams methods
	this.addTeam = function(taskId) {
		var task = this.tasks[taskId];
		var students = Array.prototype.slice.call(arguments, 1);
		task.addTeam(students);
	}
	// marks methods
	this.addStudentMark = function(mark, taskId, studentId) {
		task = this.tasks[taskId];
		task.addStudentMark(mark, studentId);
	}
	this.addTeamMark = function(mark, taskId, teamId) {
		task = this.tasks[taskId];
		task.addTeamMark(mark, teamId);
	}
	this.showStudentMarks = function(studentId) {
		var str = 'student: ' + studentId + ' ';
		for (var i = 0; i < this.tasks.length; i++)
			str += this.tasks[i].showStudentMarks(studentId) + ' ';
		
		return str;
	}
	this.showMarks = function() {
		var str = '';
		for (var st in this.students)
			str += this.showStudentMarks(st) + '\n';

		return str;
	}
	// priority lists
	// teachersId = array of ids of teachers. first - highest priority, last - lowest
	this.addTeachersToStudentsList = function(studentId, teachersIds) {
		this.studentsLists[studentId] = teachersIds;
	}
	// teachersId = array of ids of teachers. first - highest priority, last - lowest
	this.addStudentsToTeachersList = function(teacherId, studentsIds) {
		this.teachersLists[teacherId] = studentsIds;
	}
	this.showStudentsPriorities = function() {
		var str = '';
		for (var i in this.studentsLists)
			str += this.studentsLists[i].join(' ') + '\n';

		return str;
	}
	this.showTeachersPriorities = function() {
		var str = '';
		for (var i in this.teachersLists) 
			str += this.teachersLists[i].join(' ') + '\n';

		return str;
	}
	var studentTeachers = [];	// stores decisions
	this.solveDistributeStudents = function() {
		var maxStudents = Math.ceil(this.students.length / this.teachers.length);
		var minStudents = Math.floor(this.students.length / this.teachers.length);

		var offersTable = [];		// stores current offers and decisions
		offersTable.length = this.teachers.length;
		for (var i = 0; i < this.teachers.length; i++) {
			offersTable[i] = [];
			offersTable[i].length = this.students.length + 1;
		}
		
		var make_offer = function(studentId, teacherId) {
			if (offersTable[teacherId][this.teachers.length] != 1) {	// not yet solved teacher
				offersTable[teacherId][studentId] = 'm';
				process_teacher.call(this, teacherId);
			}
			else 
				mark_student_bad.call(this, studentId);
		}
		var process_teacher = function(teacherId) {
			var countAll = 0;		// amount of better untaken students
			var countBest = 0;		// better offers or already taken students
			var countStudents = 0;	// already taken students
			
			for (var i = 0; i < this.teachersLists[teacherId].length; i++) {
				var studentId = this.teachersLists[teacherId][i];
				if (teacherId == 3 && studentId == 4)
					var a = 10;
	
				if (offersTable[teacherId][studentId] != '-') {
					// all not taken students
					countAll++;
					
					// students among maxStudents best allowable
					if (offersTable[teacherId][studentId] == 'm' && countAll <= maxStudents) {
						offersTable[teacherId][studentId] = '+';
						mark_student_good.call(this, studentId, teacherId);
					}

					// accepted students 
					if (offersTable[teacherId][studentId] == '+')
						countStudents++;

					if (countStudents == maxStudents)
						offersTable[teacherId][this.students.length] = 1;
					
					// there are better offers
					if (offersTable[teacherId][studentId] == 'm' || offersTable[teacherId][studentId] == '+')
						countBest++;
					if (offersTable[teacherId][studentId] == 'm' && countBest > maxStudents) {
						offersTable[teacherId][studentId] = '-';
						mark_student_bad.call(this, studentId);
					}
				}
			}
		}
		var mark_student_good = function(studentId, teacherId) {
			studentTeachers[studentId] = teacherId;
			find++;
			for (var i = 0; i < this.teachers.length; i++) {
				if (offersTable[i][studentId] == 'm') {
					offersTable[i][studentId] = '-';
					process_teacher.call(this, i);
				} else
					offersTable[i][studentId] = '-';
			}
			offersTable[teacherId][studentId] = '+';
		}
		var mark_student_bad = function(studentId) {
			studentIndex[studentId]++;
			queue.push([studentId, this.studentsLists[studentId][studentIndex[studentId]]]);
		}
		var take_first_student = function() {
			for (var i = 0; i < this.teachers.length; i++) {
				if (offersTable[i][this.students.length] != 1) {
					for (var j = 0; j < this.students.length; j++) {
						if (this.teachersLists[i] !== undefined) {
							var studentId = this.teachersLists[i][j];
							if (offersTable[i][studentId] == 'm') {
								mark_student_good.call(this, studentId, i);
								process_teacher.call(this, i);
							}
						}
					}						
				}
			}
		}

		studentTeachers.length = this.students.length;
		var find = 0;				// amount of founded

		var studentIndex = [];		// stores current offer to teacher for every student
		studentIndex.length = this.students.length;
		for (var i = 0; i < studentIndex.length; i++)
			studentIndex[i] = 0;

		var queue = [];
		for (var i = 0; i < this.students.length; i++) {
			if (this.students[i] !== undefined)
				queue.push([i, this.studentsLists[i][studentIndex[i]]]);
		}			
		
		while (queue.length != 0) {
			var pair = queue.shift();
			make_offer.call(this, pair[0], pair[1]);

			if (queue.length == 0 && find != this.students.length)
				take_first_student.call(this);
		}
	}
	this.showTeachersResults = function() {
		var result = [];
		for (var i = 0; i < studentTeachers.length; i++) {
			if (studentTeachers[i] !== undefined) {
				var str = result[studentTeachers[i]];
				if (str === undefined)
					str = '=> ';
				else str += ', ';
				str += i + ' ' + this.students[i].fullName + ' ';
				result[studentTeachers[i]] = str;
			}
		}

		var resstr = '';
		for (var i = 0; i < result.length; i++)
			if (result[i] !== undefined)
				resstr += result[i] + '\n';
		return resstr;
	}
	this.showStudentsResults = function() {
		var str = '';
		for (var i = 0; i < this.students.length; i++) {
			if (studentTeachers[i] !== undefined)
				str += '=> ' + studentTeachers[i] + ' ' + this.teachers[studentTeachers[i]].fullName + '\n';
		}
		return str;
	}
}

function loadJSON(url) {
	$.getJSON(url, function(jsonData) {
		console.log("...load JSON");
	}).done(function(jsonData) {

		function loadStudents() {
			var students = jsonData['students'];
			for (var i = 0; i < students.length; i++) {
				var student = new Student(students[i]['name'], students[i]['surname'], students[i]['id']);
				school.addStudent(student);
			}
		}
		function loadTeachers() {
			var teachers = jsonData['teachers'];
			for (var i = 0; i < teachers.length; i++) {
				var teacher = new Teacher(teachers[i]['name'], teachers[i]['surname'], teachers[i]['id']);
				school.addTeacher(teacher);
			}
		}
		function loadStudentsPriorities() {
			var lists = jsonData['studentsLists'];
			for (var i = 0; i < lists.length; i++) {
				school.addTeachersToStudentsList(lists[i]['id'], lists[i]['priorities']);
			}
		}
		function loadTeachersPriorities() {
			var lists = jsonData['teachersLists'];
			for (var i = 0; i < lists.length; i++) {
				school.addStudentsToTeachersList(lists[i]['id'], lists[i]['priorities']);
			}
		}

		loadStudents();
		loadTeachers();
		loadStudentsPriorities();
		loadTeachersPriorities();

		showData();
	})
	.fail(function() {
		console.log("json load error");
	});
}

var school = new School();
loadJSON('data.json');

function showData() {
	$('#students_out').html('<pre>' + school.showStudents() + '</pre>');
	$('#teachers_out').html('<pre>' + school.showTeachers() + '</pre>');
	$('#students_priority_out').html('<pre>' + school.showStudentsPriorities() + '</pre>');
	$('#teachers_priority_out').html('<pre>' + school.showTeachersPriorities() + '</pre>');
}

function showStudentsResults() {
	$('#students_result_out').html('<pre>' + school.showStudentsResults() + '</pre>');
}

function showTeachersResults() {
	$('#teachers_result_out').html('<pre>' + school.showTeachersResults() + '</pre>');
}

function solve() {
	var result = school.solveDistributeStudents();
	showStudentsResults();
	showTeachersResults();
}

// var st1 = new Student("Sur1", "Name1");
// var st2 = new Student("Sur2", "Name2");
// var st3 = new Student("Sur3", "Name3");
// var st4 = new Student("Sur4", "Name4");
// var st5 = new Student("Sur5", "Name5");
// var st6 = new Student("Sur6", "Name6");

// var teacher1 = new Teacher("TSur1", "Name1");
// var teacher2 = new Teacher("TSur2", "Name2");
// var teacher3 = new Teacher("TSur3", "Name3");
// var teacher4 = new Teacher("TSur4", "Name4");

// var school = new School();
// school.addStudent(st1);
// school.addStudent(st2);
// school.addStudent(st3);
// school.addStudent(st4);
// school.addStudent(st5);
// school.addStudent(st6);

// school.addTeacher(teacher1);
// school.addTeacher(teacher2);
// school.addTeacher(teacher3);
// school.addTeacher(teacher4);

// console.log(school.showStudents());
// console.log(school.showTeachers());

// // school.addTask('individual');
// // var task = school.addTask('team');
// // school.addTeam(task, 1, 2, 3);
// // school.addTeam(task, 4, 0);

// // school.addTask('individual');
// // school.addTask('individual');
// // school.addTask('individual');

// // school.addStudentMark(5, 2, 3);
// // school.addStudentMark(4, 3, 3);
// // school.addTeamMark(5, 1, 1);

// // school.addStudentsToTeachersList(0, [1, 0]);
// // school.addStudentsToTeachersList(1, [1, 0]);
// // school.addTeachersToStudentsList(0, [1, 0]);
// // school.addTeachersToStudentsList(1, [0, 1]);


// school.addStudentsToTeachersList(0, [0, 1, 2, 3, 4, 5]);
// school.addStudentsToTeachersList(1, [2, 3, 5, 4, 1, 0]);
// school.addStudentsToTeachersList(2, [4, 5, 3, 2, 1, 0]);
// school.addStudentsToTeachersList(3, [4, 5, 3, 2, 1, 0]);

// school.addTeachersToStudentsList(0, [0, 1, 2, 3]);
// school.addTeachersToStudentsList(1, [2, 3, 1, 0]);
// school.addTeachersToStudentsList(2, [3, 2, 1, 0]);
// school.addTeachersToStudentsList(3, [3, 2, 1, 0]);
// school.addTeachersToStudentsList(4, [3, 2, 0, 1]);
// school.addTeachersToStudentsList(5, [1, 2, 3, 0]);

// console.log(school.studentsLists);
// console.log(school.teachersLists);

// school.solveDistributeStudents();