describe('Create Page Test', () => {
    beforeEach(() => {
        cy.clearLocalStorage();
        cy.visit('http://localhost:3000/login');
        cy.get('input[type="email"]').type('validEmail@example.com');
        cy.get('input[type="password"]').type('validPassword1!');
        cy.get('button[type="submit"]').click();
        cy.contains('You have successfully logged in.');
        cy.url().should('include', '/dashboard');
        cy.visit('http://localhost:3000/create');
    });
  
    it('Should display the sidebar with navigation buttons', () => {
      cy.get('.side_bar').within(() => {
        cy.contains('Speech to Text Application').should('exist');
        cy.contains('Home').should('exist');
        cy.contains('Profile').should('exist');
        cy.contains('Log Out').should('exist');
      });
    });

    
    it('Should display a textarea to view the transcription', () => {
        cy.get('textarea[id="speech"]').should('exist');
    });

    it('Should have a start button which turns into stop when clicked making the controller button visible', () => {
        cy.get('.start_button').should('exist');
        cy.get('.start_button').should('contain', 'Start');
        cy.get('.start_button').click();
        cy.get('.start_button').should('contain', 'Stop');
        cy.get('.controller').should('be.visible');
    })

    it('Should let users toggle between pause and resume controller', () => {
        cy.get('.start_button').click();
        cy.get('.controller').should('contain', 'Pause');
        cy.get('.controller').click();
        cy.get('.controller').click();
        cy.get('.controller').should('contain', 'Resume');
        cy.get('.controller').click();
        cy.get('.controller').should('contain', 'Pause');
        cy.get('.start_button').click();
    })

    it('Should not let users save and export empty speech', () => {
        cy.get('.start_button').click();
        cy.get('.start_button').click();
        cy.get('.save_button').should('be.disabled');
        cy.get('.export_button').should('be.disabled');
    })

    it('Should let users click save and open the save modal after stopping the session', () => {
        cy.get('.start_button').click();
        cy.get('textarea').type('Speech');
        cy.get('.start_button').click();
        cy.get('.save_button').click();
        cy.get('.save_modal').should('be.visible');
    })

    it('Should let users type the title into an input field and save it navigating to dashboard', () => {
        cy.get('.start_button').click();
        cy.get('textarea').type('Speech');
        cy.get('.start_button').click();
        cy.get('.save_button').click();
        cy.get('.save_modal').should('be.visible');
        cy.get('input[id="title"]').should('exist');
        cy.get('.confirm_save').should('be.disabled');
        cy.get('input[id="title"]').type('Title');
        cy.get('.confirm_save').click();
        cy.url().should('include', '/dashboard')
    })

    it('Should close the save modal when cancelled', () => {
        cy.get('.start_button').click();
        cy.get('textarea').type('Speech');
        cy.get('.start_button').click();
        cy.get('.save_button').click();
        cy.get('.save_modal').should('be.visible');
        cy.contains('Cancel').click();
        cy.get('.save_modal').should('not.exist');
    })

    it('Should start a new session when create new is clicked', () => {
        cy.get('.start_button').click();
        cy.get('.start_button').click();
        cy.contains('Create New').click();
        cy.get('textarea[id="speech"]').should('have.value', '');
        cy.url().should('include', '/create'); 
        cy.contains('Save').should('be.disabled');
        cy.contains('Delete').should('be.disabled');
        cy.contains('Resume').should('be.disabled');
        cy.contains('Export').should('be.disabled');
        cy.contains('Create New').should('be.disabled');
    })

    it('Should open the delete modal and start new session when confirmed', () => {
        cy.get('.start_button').click();
        cy.get('.start_button').click();
        cy.contains('Delete').click();
        cy.get('.delete_modal').should('be.visible'); 
        cy.get('.confirm_delete').click(); 
        cy.get('textarea[id="speech"]').should('have.value', '');
        cy.url().should('include', '/create'); 
        cy.contains('Save').should('be.disabled');
        cy.contains('Delete').should('be.disabled');
        cy.contains('Resume').should('be.disabled');
        cy.contains('Export').should('be.disabled');
        cy.contains('Create New').should('be.disabled');
    });

    it('Should close the delete modal when cancelled', () => {
        cy.get('.start_button').click();
        cy.get('.start_button').click();
        cy.contains('Delete').click();
        cy.contains('Cancel').click();
        cy.get('delete_modal').should('not.exist');
    })

    it('Should open and close the export modal', () => {
        cy.get('.start_button').click();
        cy.get('textarea').type('Speech');
        cy.get('.start_button').click();
        cy.contains('Export').click();
        cy.get('.export_modal').should('be.visible'); 
        cy.contains('Cancel').click();
        cy.get('.export_modal').should('not.exist'); 
    });

    it('Should export speech data as .txt file', () => {
        cy.get('.start_button').click();
        cy.get('textarea').type('Speech');
        cy.get('.start_button').click();
        cy.contains('Export').click();
        cy.contains('Export as .txt').click();
        cy.get('.export_modal').should('not.exist');
    });

    it('Should export speech data as .csv file', () => {
        cy.get('.start_button').click();
        cy.get('textarea').type('Speech');
        cy.get('.start_button').click();
        cy.contains('Export').click();
        cy.contains('Export as .csv').click();
        cy.get('.export_modal').should('not.exist');
    });

    it('Should navigate correctly using the sidebar links', () => {
        cy.contains('Home').click();
        cy.url().should('include', '/dashboard');
        cy.visit('http://localhost:3000/create');
    
        cy.contains('Profile').click();
        cy.url().should('include', '/profile');
        cy.visit('http://localhost:3000/create');
    
        cy.contains('Log Out').click();
        cy.url().should('include', '/login');
    });
    
});
  