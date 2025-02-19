describe('Profile Page Test', () => {
    beforeEach(() => {
        cy.clearLocalStorage();
        cy.visit('http://localhost:3000/login');
        cy.get('input[type="email"]').type('validEmail@example.com');
        cy.get('input[type="password"]').type('validPassword1!');
        cy.get('button[type="submit"]').click();
        cy.contains('You have successfully logged in.');
        cy.url().should('include', '/dashboard');
        cy.visit('http://localhost:3000/profile');
    });
  
    it('Should display the sidebar with navigation buttons', () => {
      cy.get('.side_bar').within(() => {
        cy.contains('Speech to Text Application').should('exist');
        cy.contains('Home').should('exist');
        cy.contains('Create New').should('exist');
        cy.contains('Log Out').should('exist');
      });
    });

    it('Should have user information with edit and change password buttons', () => {
        cy.get('.first_name').should('exist').and('contain', 'First Name:').and('contain', 'Edit');
        cy.get('.last_name').should('exist').and('contain', 'Last Name:').and('contain', 'Edit');
        cy.contains('Change Password').should('exist');
    })

    it('Should open first name and last name edit modals when clicked edit for each and let users to update their name', () => {
        cy.get('.edit_first_name').click();
        cy.get('.edit_first_modal').should('be.visible'); 
        cy.contains('Cancel').click();
        cy.get('.edit_first_modal').should('not.exist');
        
        cy.get('.edit_first_name').click();
        cy.get('input[id="first_name"]').should('exist');
        cy.get('input[id="first_name"]').clear().type('Name');
        cy.contains('Save').click();
        cy.get('.first_name').should('contain', 'Name'); 
        
        cy.get('.edit_last_name').click();
        cy.get('.edit_last_modal').should('be.visible');
        cy.contains('Cancel').click();
        cy.get('.edit_last_modal').should('not.exist');
        
        cy.get('.edit_last_name').click();
        cy.get('input[id="last_name"]').should('exist');
        cy.get('input[id="last_name"]').clear().type('Name'); 
        cy.contains('Save').click();
        cy.get('.last_name').should('contain', 'Name');
    });

    it('Should open the password update modal when clicked, check for validation and match errors', () => {
        cy.get('button').contains('Change Password').click();
        cy.get('.password_modal').should('be.visible');
        cy.get('button').contains('Save').click();
        cy.get('.error_message').should('contain', '*Your password must be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character');
        cy.get('input[id="new_password"]').type('NewPass1!');
        cy.get('button').contains('Save').click();
        cy.get('.match_error').should('contain', '*Passwords do not match');

        cy.get('input[id="current_password"]').type('validPassword1!'); 
        cy.get('input[id="new_password"]').clear().type('NewPass1!'); 
        cy.get('input[id="re_password"]').clear().type('NewPass1!'); 
    
        cy.get('button').contains('Save').click();
    
        cy.get('.password_modal').should('not.exist'); 
        cy.get('.error_message').should('not.exist'); 
        cy.get('.match_error').should('not.exist'); 

        //Change it back
        cy.get('button').contains('Change Password').click();
        cy.get('input[id="current_password"]').type('NewPass1!'); 
        cy.get('input[id="new_password"]').clear().type('validPassword1!'); 
        cy.get('input[id="re_password"]').clear().type('validPassword1!'); 
    
        cy.get('button').contains('Save').click();
    
    });

    it('Should delete the profile', () => {
      cy.get('button').contains('Delete Account').click();
      cy.get('.delete_modal').should('be.visible');
      cy.get('button').contains('Confirm').click();
      cy.get('.success_message').should('contain', 'Your account has been deleted successfully!');
      cy.url().should('include', '/login');
    })
});
  