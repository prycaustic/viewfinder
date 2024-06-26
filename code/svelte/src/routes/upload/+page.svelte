<script>
    import { onMount } from 'svelte';
    import { invalidateAll } from '$app/navigation';
    import { Plus16, Upload16, X16 } from 'svelte-octicons';
    import Button from '$lib/components/Button.svelte';
    import IconButton from '$lib/components/IconButton.svelte';
    import ImagePreview from '$lib/components/ImagePreview.svelte';

    /** @type {import('./$types').PageData} */
    export let data;

    let albumDialog;
    let isImageSelected = false;
    let selectedImageIndex;

    // Image objects to be uploaded to database
    let images = [];

    function appendImage(title, previewURL, fileData) {
        let newImage = {
            _preview: previewURL,
            title: title,
            description: "This is a description.",
            albumId: -1,
            tags: [],
            data: fileData,
        };
        images.push(newImage);
        imageOnClick({ currentTarget: previewURL });
    }

    function removeSelectedImage() {
        images.splice(selectedImageIndex, 1);
        document.querySelector('#title').value = '';
        document.querySelector('#description').value = '';
        document.querySelector('#albumId').value = -1;
        isImageSelected = false;
        document.querySelector('#image-previews button.selected').remove();
    }

    // Image previews
    let imageOnClick = (e) => {
        let imgData = images.find(i => i._preview === e.currentTarget);
        
        isImageSelected = true;
        selectedImageIndex = images.indexOf(imgData);
        document.querySelector('#title').value = imgData.title;
        document.querySelector('#description').value = imgData.description;
        document.querySelector('#albumId').value = imgData.albumId;

        for (const button of document.querySelectorAll('#image-previews button')) {
            button.classList.remove('selected');
        }
        e.currentTarget.classList.add('selected');
    }

    function createPreview(src) {
        let previewComponent = new ImagePreview({
            target: document.querySelector('#image-previews'),
            props: {
                src,
                onClick: imageOnClick
            }
        });

        return previewComponent._element;
    }

    // Image files handler
    let files;

    $: if (files) {
        for (const file of files) {
            const reader = new FileReader();
            
            reader.readAsDataURL(file);
            reader.addEventListener('load', () => {
                let previewURL = createPreview(reader.result);
                let title = file.name.split('.').slice(0, -1);
                appendImage(title, previewURL, file);
            });
        };
    }

    // Upload handler
    function handleUpload() {
        for (const img of images) {
            let formData = new FormData();
            formData.append('title', img.title);
            formData.append('description', img.description);
            formData.append('albumId', img.albumId);
            formData.append('tags', img.tags);
            formData.append('photo', img.data);

            fetch('/api/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                // Redirect to user profile
                location.reload();
            })
            .catch(error => {
                console.error(error);
            });
        }
    }

    onMount(() => {
        // Metadata editor
        let title = document.querySelector('#title');
        let description = document.querySelector('#description');
        let albumId = document.querySelector('#albumId');

        title.addEventListener('input', () => {
            images[selectedImageIndex].title = title.value;
        });

        description.addEventListener('input', () => {
            images[selectedImageIndex].description = description.value;
        });

        albumId.addEventListener('input', () => {
            images[selectedImageIndex].albumId = albumId.value;
        });

        // Album creation
        let albumForm = document.querySelector('.create-album-dialog form')
        let createAlbumButton = albumForm.querySelector('button');

        createAlbumButton.addEventListener('click', (e) => {
            e.preventDefault();
            albumDialog.close();
            let formData = new FormData(albumForm);
            let albumChoices = document.querySelector('#albumName');

            fetch('/api/edit/album', {
                method: 'POST',
                body: formData
            })
            .then(res => {
                invalidateAll(); // Runs the page.server.js load function again
                
                albumChoices.innerHTML = '';
                for (const album of data.userAlbums) {
                    let option = document.createElement('option');
                    option.value = album.AlbumID;
                    option.text = album.Name;
                    albumChoices.add(option);
                }
            })
            .catch(error => {
                console.error(error);
            });
        })
    })
</script>

<svelte:head>
    <title>Upload Images</title>
</svelte:head>
<dialog bind:this={albumDialog} class="create-album-dialog round-corners">
    <section>
        <header class="flex space-between align-center margin-bottom-1">
            <h2 class="margin-0">Create a new album</h2>
            <IconButton on:click={albumDialog.close()} title="Cancel album creation" disableBackground>
                <X16 />
            </IconButton>
        </header>
        <form action="/api/edit/album" method="POST" class="flex-column">
            <label for="album-name">Name</label>
            <input type="text" id="album-name" name="album-name" placeholder="Enter a name." autocomplete="off"/>

            <label for="album-description">Description</label>
            <textarea type="text" id="album-description" name="album-description" placeholder="Enter a description." autocomplete="off"/>

            <Button type="submit">Create</Button>
        </form>
    </section>
</dialog>
<main>
    <section class="upload-menu">
        <section class="image-upload">
            <h1>Upload Images</h1>
            <section id="image-previews">
                <section id="upload-button">
                    <input bind:files type="file" accept="image/png, image/jpeg" multiple id="file-upload" name="file-upload" class="hidden">
                    <label for="file-upload" class="round-corners">
                        <Upload16 />
                        <span>Add Image</span>
                    </label>
                </section>
            </section>
        </section>
        <section class="options">
            <aside class="edit-image-details round-corners" class:hidden={!isImageSelected}>
                <h3>Edit Image</h3>
                <hr />
                <form class="flex-column">
                    <label for="title">Title</label>
                    <input type="text" id="title" name="title" placeholder="Enter a title."/>

                    <label for="description">Description</label>
                    <textarea id="description" name="description" placeholder="Enter a description."></textarea>

                    <section class="flex space-between align-center">
                        <label for="album">Album</label>
                        <IconButton on:click={albumDialog.showModal()} disableBackground>
                            <Plus16 />
                        </IconButton>
                    </section>
                    <select id="albumId" name="albumId">
                        <option value="-1">None</option>
                        {#each data.userAlbums as album}
                            <option value="{album.AlbumID}">{album.Name}</option>
                        {/each}
                    </select>

                    <!--
                    <label for="tags">Tags</label>
                    <input type="text" id="tags" name="tags" />
                    -->

                    <Button on:click={removeSelectedImage} align="center" color="gray">Remove image</Button>
                </form>
            </aside>
            <section id="upload-actions" class="flex space-between">
                <Button on:click={handleUpload}>Upload Images</Button>
            </section>
        </section>
    </section>
</main>

<style>
    main {
        height: calc(100% - var(--footer-height));
    }

    .create-album-dialog {
        min-width: 20rem;
    }

    .upload-menu {
        display: grid;
        grid-template-columns: 1fr 20rem;
        gap: 1rem;
        padding: 2rem;
        height: 100%;
    }

    #upload-button label {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        height: 100%;
        background: var(--gradient-gray);
        border: 1px solid var(--color-gray);
        text-align: center;
    }

    #image-previews {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
        grid-template-rows: repeat(auto-fill, 8rem);
        gap: 0.5rem;
    }
    
    :global(#image-previews button) {
        position: relative;
        padding: 0;
        overflow: hidden;
        border-radius: 0.5rem;
        border: 1px solid var(--color-gray);
        top: 0;
        transition: top 200ms;
    }

    :global(#image-previews .selected) {
        border: 1px solid var(--color-primary);
        box-shadow: var(--bold-shadow);
        top: -0.2rem;
    }

    .edit-image-details {
        width: 20rem;
        background: var(--color-white-gradient);
        border: 1px solid var(--color-gray);
    }

    .edit-image-details h3 {
        padding: 1rem;
        margin: 0;
    }

    .edit-image-details hr {
        margin: 0;
        border: 0.5px solid var(--color-gray);
    }
    
    .edit-image-details form {
        display: flex;
        flex-direction: column;
        padding: 1rem;
    }

    .options {
        position: relative;
    }
    
    #upload-actions {
        width: 100%;
        position: absolute;
        bottom: 0;
    }
</style>
