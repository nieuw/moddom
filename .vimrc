let g:syntastic_javascript_checkers = ['eslint']

"FuzzyFinder should ignore all files in .gitignore
let ignorefile = ".gitignore"
if filereadable(ignorefile)

    let ignore = '\v\~$'
    for line in readfile(ignorefile)
        let line = substitute(line, '\.', '\\.', 'g')
        let line = substitute(line, '\*', '.*', 'g')
        let ignore .= '|^' . line
    endfor

    let g:fuf_file_exclude = ignore
endif
