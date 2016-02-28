Streak = new Mongo.Collection("streak");

ConsistentDB = new Mongo.Collection("itemList");


if (Meteor.isClient) {
	Meteor.subscribe("streak");
	Meteor.subscribe("itemList");

//validators
trimInput = function(value) {
	return value.replace(/^\s*|\s*$/g, '');
};

isNotEmpty = function(value) {
	if (value && value !== ''){
		return true;
	}
	console.log('Please fill in all required fields.');
	return false;
};

isEmail = function(value) {
	var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
	if (filter.test(value)) {
		return true;
	}
	console.log('Please enter a valid email address.');
	return false;
};

isValidPassword = function(password) {
	if (password.length < 6) {
		console.log('Your password should be 6 characters or longer.');
		return false;
	}
	return true;
};

areValidPasswords = function(password, confirm) {
	if (!isValidPassword(password)) {
		return false;
	}
	if (password !== confirm) {
		console.log('Your two passwords are not equivalent.');
		return false;
	}
	return true;
};
//end validators
function countItem(){
	return ConsistentDB.find({owner: Meteor.userId()}).count();
}

function countDone(){
	return ConsistentDB.find({owner: Meteor.userId(), checked: true}).count();
}

function getDonePercentage(){
	var getDonePercentage = 70;
	return getDonePercentage;
}

function checkCompletion(){
	if (getDonePercentage() === 100 && countItem() > 0){
		return true;
	} else {
		return false;
	}
}

function getStreak(){
	return Streak.findOne({user:Meteor.userId()},{streak:1}).streak;
}

Template.items.onRendered(function () {
    this.$('.modal-trigger').leanModal({});
});

Template.body.helpers({
	itemList: function(){
		return ConsistentDB.find({owner: Meteor.userId()});
	},
	countItem: function(){
		return countItem();
	},
	countDone: function(){
		return countDone();
	},
	getDonePercentage: function(){
		return getDonePercentage();
	},
	checkCompletion: function(){
		return checkCompletion();
	},
	getUserEmail: function(){
		var email = Meteor.user().emails[0].address;
		return email.toUpperCase();
	},
	getStreak: function(){
		return getStreak();
	},
	checkStreak: function(){
		if (getStreak()>0){
			return true;
		} else {
			return false;
		}

	}
});

Template.body.events({
	'submit .addItem': function (event) {
		//from field values
		var addItem = event.target.addItem.value;
		var targetAmount = event.target.targetAmount.value;
		var currentAmount = event.target.currentAmount.value;
		var savingsMonthly = event.target.savingsMonthly.value;
		//derived values
		var balanceAmount = targetAmount - currentAmount;
		var monthsNeeded = balanceAmount/savingsMonthly;
		var progressPercentage = currentAmount / targetAmount * 100;
		if ($.trim(addItem) === '' ){
			Materialize.toast("Fied may not be empty", 4000);
			return false;
		} else {
			var item = addItem.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
			Meteor.call("addItemMethod", item, targetAmount, currentAmount, savingsMonthly, balanceAmount, monthsNeeded, progressPercentage);
			event.target.addItem.value = "";
			event.target.targetAmount.value = "";
			event.target.currentAmount.value = "";
			event.target.savingsMonthly.value = "";

			return false;     
		}
	}

});

Template.items.events({
	'click .delete': function(){
		Meteor.call("deleteItemMethod",this._id);
	},
	'submit .updateGoal': function (event) {
		//from field values
		var item = event.target.updateItem.value;
		var targetAmount = event.target.updateTargetAmount.value;
		var currentAmount = event.target.updateCurrentAmount.value;
		var savingsMonthly = event.target.updateSavingsMonthly.value;

		//derived values
		var balanceAmount = targetAmount - currentAmount;
		var monthsNeeded = balanceAmount/savingsMonthly;
		var progressPercentage = currentAmount / targetAmount * 100;
		if ($.trim(item) === '' ){
			Materialize.toast("Fied may not be empty", 4000);
			return false;
		} else {
			var item = item.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
			Meteor.call("updateItemMethod", this._id, item, targetAmount, currentAmount, savingsMonthly, balanceAmount, monthsNeeded, progressPercentage);
			event.target.updateItem.value = "";
			event.target.updateTargetAmount.value = "";
			event.target.updateCurrentAmount.value = "";
			event.target.updateSavingsMonthly.value = "";

			return false;     
		}
	}
})

Template.login.events({
	'submit form': function(event){
		event.preventDefault();
		var emailVar = event.target.loginEmail.value;
		var email = emailVar.toLowerCase();
		var passwordVar = event.target.loginPassword.value;
		Meteor.loginWithPassword(email, passwordVar, function(error) {
			if (error) {
				Materialize.toast("Error: "+error.reason, 4000);
			} 
		});
	}
});

Template.changePassword.events({
	'submit .changePassword': function(event) {
		event.preventDefault();
		var currentPassword = event.target.oldPassword.value;
		var newPassword = event.target.newPassword.value;
		var confirmPassword = event.target.confirmPassword.value;

		if (newPassword !== confirmPassword) {
			Materialize.toast('Error: Different New and Confirm Password', 4000);
			return false;
		}
		Accounts.changePassword(currentPassword, newPassword, function(error) {
			if (error) {
				Materialize.toast("Error: "+error.reason, 4000);
			} else {
				Materialize.toast("Password Changed!", 4000);
			}
		});

		event.target.oldPassword.value = "";
		event.target.newPassword.value = "";
		event.target.confirmPassword.value = "";
		return false;
	}
});

Template.register.events({
	'submit form': function(event) {
		event.preventDefault();
		var emailVar = event.target.registerEmail.value;
		var email = emailVar.toLowerCase();
		var passwordVar = event.target.registerPassword.value;

		var re = /\S+@\S+\.\S+/;
		if (re.test(email)){

			Accounts.createUser({
				email: email,
				password: passwordVar,

			}, function(err) {
				if (err) {
					Materialize.toast("Error: "+err.message, 4000);
				} else {
					Streak.insert({user: Meteor.userId(), isDone: false, streak: 0});
				}
			});
		} else {
			Materialize.toast("Error: Invalid email", 4000);

		}

	}
});

Template.logout.events({
	'click .logout': function(event){
		event.preventDefault();
		Meteor.logout();
	}
});

 // Do not forget to add the email package: $ meteor add email
// and to configure the SMTP: https://gist.github.com/LeCoupa/9879221

Template.ForgotPassword.events({
	'submit #forgotPasswordForm': function(e, t) {
		e.preventDefault();

		var forgotPasswordForm = $(e.currentTarget),
		email = trimInput(forgotPasswordForm.find('#forgotPasswordEmail').val().toLowerCase());

		if (isNotEmpty(email) && isEmail(email)) {

			Accounts.forgotPassword({email: email}, function(err) {
				if (err) {

					Materialize.toast('Error: '+err.message, 4000);

				} else {
					Materialize.toast('Email Sent. Check your mailbox.', 4000);
				}
			});

		} else{
			Materialize.toast('Error: Invalid Email');
		}
		return false;
	},
});

if (Accounts._resetPasswordToken) {
	Session.set('resetPassword', Accounts._resetPasswordToken);
}

Template.body.helpers({
	resetPassword: function(){
		return Session.get('resetPassword');
	}
});

Template.ResetPassword.events({
	'submit #resetPasswordForm': function(e, t) {
		e.preventDefault();

		var resetPasswordForm = $(e.currentTarget),
		password = resetPasswordForm.find('#resetPasswordPassword').val(),
		passwordConfirm = resetPasswordForm.find('#resetPasswordPasswordConfirm').val();

		if (isNotEmpty(password) && areValidPasswords(password, passwordConfirm)) {
			Accounts.resetPassword(Session.get('resetPassword'), password, function(err) {
				if (err) {
					Materialize.toast('Error: Something went wrong.', 4000);
				} else {
					Materialize.toast('Your password has been changed. Welcome back!', 4000);
					Session.set('resetPassword', null);
				}
			});
		}
		return false;
	}
});
}

if (Meteor.isServer) {


	Meteor.startup(function () {

		var updateStreakCount = function () {
			Streak.update({isDone:true}, {$inc: {streak:1}},{multi:true});
			Streak.update({isDone: false},{$set: {streak:0}},{multi:true});
			Streak.update({}, {$set: {isDone:false}},{multi:true});
			ConsistentDB.update({checked: true},{$set: {checked:false}},{multi:true});

			console.log('It is a new day. Streak Count Updated. Done Status Reset.');
		}   


		var cron = new Meteor.Cron( {
			events:{
				"59 23 * * *"  : updateStreakCount
			}
		});


      	// By default, the email is sent from no-reply@meteor.com. If you wish to receive email from users asking for help with their account, be sure to set this to an email address that you can receive email at.
        Accounts.emailTemplates.from = 'Daily Do <no-reply@dailydo.com>';

		// The public name of your application. Defaults to the DNS name of the application (eg: awesome.meteor.com).
		Accounts.emailTemplates.siteName = 'Daily Do';

		smtp = {
		    username: 'tengkuhafidz@gmail.com',   // eg: server@gentlenode.com
		    password: 'virusb14',   // eg: 3eeP1gtizk5eziohfervU
		    server:   'smtp.gmail.com',  // eg: mail.gandi.net
		    port: 465
		}

		process.env.MAIL_URL = 'smtp://' + encodeURIComponent(smtp.username) + ':' + encodeURIComponent(smtp.password) + '@' + encodeURIComponent(smtp.server) + ':' + smtp.port;
	    // code to run on server at startup
	    Meteor.publish("itemList",function(){
	    	return ConsistentDB.find();
	    });

	    Meteor.publish("streak",function(){
	    	return Streak.find();
	    });

	});
}

Meteor.methods({
	addItemMethod: function(item, targetAmount, currentAmount, savingsMonthly, balanceAmount, monthsNeeded, progressPercentage){
		ConsistentDB.insert({
			item: item,
			targetAmount: targetAmount,
			currentAmount: currentAmount,
			savingsMonthly: savingsMonthly,
			balanceAmount: balanceAmount,
			monthsNeeded: monthsNeeded,
			progressPercentage:progressPercentage,
			dateCreated: new Date(),
          	owner: Meteor.userId(),           // _id of logged in user
      });
	},
	deleteItemMethod: function(id){
		ConsistentDB.remove(id);
	},
	updateItemMethod: function(id, item, targetAmount, currentAmount, savingsMonthly, balanceAmount, monthsNeeded, progressPercentage){
		ConsistentDB.update(id, {
			$set: {
				item: item, 
				targetAmount: targetAmount, 
				currentAmount: currentAmount, 
				savingsMonthly: savingsMonthly, 
				balanceAmount: balanceAmount, 
				monthsNeeded: monthsNeeded, 
				progressPercentage: progressPercentage, 
				dateCreated: new Date(),
			}
		});
	},
	sendEmail: function (to, from, subject, text) {
		check([to, from, subject, text], [String]);
    // Let other method calls from the same client start running,
    // without waiting for the email sending to complete.
    this.unblock();

    Email.send({
    	to: to,
    	from: from,
    	subject: subject,
    	text: text
    });
},
isDone: function(user_id, doneStatus){

	Streak.update({user:user_id}, {$set: {isDone: doneStatus}});

},


});

