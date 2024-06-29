import fs from 'fs'

export default ({ files }) => {

    if (!files) return

    Object.values(files)
    .filter((file) => file.length > 0 && file[0].path)
    .forEach((file) => {
        fs.unlink(file[0].path, (err) => {
            if (err) console.error(err)
        })
    })

}