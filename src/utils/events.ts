// events.ts 
// for all events propagation

export const init_launchpad_events = () => {
    side_nav_events()
    tab_nav_events()
}

const side_nav_events = () => {
    const tabs = document.querySelectorAll('.side-nav')

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active-nav'));

            // Add active class to the clicked tab
            tab.classList.add('active-nav');

            // Handle tab-specific actions here
            const section = (tab as HTMLElement).dataset.section;
            if (section) {
                show_nav_content(section);
            }
        });
    });
}

const show_nav_content = (tab: string) => {
    const contents = document.querySelectorAll('.nav-content');
    
    // Hide all sections
    contents.forEach(container => container.classList.add('hidden'));

    // Find and show the selected section
    const activeContainer = document.getElementById(tab);
    activeContainer?.classList.remove('hidden');

    // Extra logic for Recent Projects (keeping your "active-tab" logic)
    const activeContainerChildren = activeContainer?.querySelectorAll('.tab-btn');
    
    // if (activeContainerChildren) {
    //     activeContainerChildren.forEach(child => child.classList.remove('active-tab'));
    //     activeContainerChildren[0]?.classList.add('active-tab'); // Add only to the first child
    // }
};

const tab_nav_events = () => {
    const tabs = document.querySelectorAll('.tab-btn')

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {

            tabs.forEach(t => t.classList.remove('active-tab'))

            tab.classList.add('active-tab')

            const section = (tab as HTMLButtonElement).dataset.section
            if(section) {
                if(tab.classList.contains('active-tab')) {
                    show_tab_content(section)
                }
            }
        })
    })
}

const show_tab_content = (tab: string) => {

    const project_contents = document.querySelectorAll('.projects-content');
    const template_contents = document.querySelectorAll('.templates-content');
    
    // Hide all sections
    project_contents.forEach(container => container.classList.add('hidden'));
    template_contents.forEach(container => container.classList.add('hidden'))

    // Find and show the selected section
    const activeContainer = document.getElementById(tab);
    activeContainer?.classList.remove('hidden');

    
}