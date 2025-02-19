describe('Speech Page Test', () => {
    beforeEach(() => {
        cy.clearLocalStorage();
        cy.visit('http://localhost:3000/login');
        cy.get('input[type="email"]').type('validEmail@example.com');
        cy.get('input[type="password"]').type('validPassword1!');
        cy.get('button[type="submit"]').click();
        cy.contains('You have successfully logged in.');
        cy.url().should('include', '/dashboard');
        cy.contains('Title').click();
    });
  
    it('Should display the sidebar with navigation buttons', () => {
      cy.get('.side_bar').within(() => {
        cy.contains('Speech to Text Application').should('exist');
        cy.contains('Home').should('exist');
        cy.contains('Create New').should('exist');
        cy.contains('Profile').should('exist');
        cy.contains('Log Out').should('exist');
      });
    });

    
    it('Should display the speech title and text area for editing', () => {
        cy.get('input[id="title"]').should('exist').and('have.value', 'Title'); 
        cy.get('textarea[id="speech"]').should('exist').and('contain', 'Speech'); 
    });

    it('Should enable the Save button when title or speech content is modified', () => {
        cy.get('input[id="title"]').clear().type('Updated Speech Title');
        cy.get('button').contains('Save').should('not.be.disabled'); 
    });

    it('Should open and close the export modal', () => {
        cy.contains('Export').click();
        cy.get('.export_modal').should('be.visible'); // Export modal should be visible
        cy.contains('Cancel').click();
        cy.get('.export_modal').should('not.exist'); // Export modal should be closed
    });

    it('Should export speech data as .txt file', () => {
        cy.contains('Export').click();
        cy.contains('Export as .txt').click();
        cy.get('.export_modal').should('not.exist');
    });

    it('Should export speech data as .csv file', () => {
        cy.contains('Export').click();
        cy.contains('Export as .csv').click();
        cy.get('.export_modal').should('not.exist');
    });

    it('Should open the delete modal and return to the dashboard after confirmation', () => {
        cy.contains('Delete').click();
        cy.get('.delete_modal').should('be.visible'); 
        cy.get('.confirm_delete').click(); 
        cy.url().should('include', '/dashboard'); 
    });
});
  