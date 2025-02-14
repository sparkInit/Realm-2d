// events.ts 
// for all events propagation

import { getConfig, setConfig } from "./configManager"
import { setActiveTab } from "./launchPad"

export const init_launchpad_events = async () => {
    await side_nav_events()
    tab_nav_events()
    get_active_tabs()
}

const get_active_tabs = async () => {
    const activeNav = await getConfig('activeNav')

    if(!activeNav) return

}

const side_nav_events = async () => {
    const tabs = document.querySelectorAll('.side-nav');
    const activeNav = await getConfig('activeNav');

    // Set the active navigation based on the store
    tabs.forEach(tab => {
        const section = tab.dataset.section;
        if (section === activeNav) {
            tab.classList.add('active-nav');
            show_nav_content(section);
        }

        tab.addEventListener('click', async () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active-nav'));

            // Add active class to the clicked tab
            tab.classList.add('active-nav');
            await setConfig('activeNav', section);

            // Show the corresponding content
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
    
    if (activeContainerChildren) {
        activeContainerChildren.forEach(child => child.classList.remove('active-tab'));
        const firstTab = activeContainerChildren[0]
        const firstTabSection = (firstTab as HTMLElement).dataset.section
        firstTab?.classList.add('active-tab')

        console.log((firstTab as HTMLElement).dataset.section)
        show_tab_content(firstTabSection)
    }
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

    console.log(tab)

    const project_contents = document.querySelectorAll('.projects-content');
    const template_contents = document.querySelectorAll('.templates-content');
    const docs_contents = document.querySelectorAll('.docs-content');
    
    // Hide all sections
    project_contents.forEach(container => container.classList.add('hidden'));
    template_contents.forEach(container => container.classList.add('hidden'))
    docs_contents.forEach(container => container.classList.add('hidden'))

    // Find and show the selected section
    const activeContainer = document.getElementById(tab);
    activeContainer?.classList.remove('hidden');

    
}